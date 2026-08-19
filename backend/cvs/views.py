import base64
import binascii

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai import (
    AIGenerationError,
    generate_experience_bullets,
    generate_skills,
    generate_summary,
    scan_passport,
)
from .exports import render_cv_docx, render_cv_pdf
from .models import CV
from .permissions import IsOwner
from .serializers import CVGenerateSerializer, CVSerializer, PassportScanSerializer


def _generate_response(prompt, mode):
    try:
        if mode == "experience":
            bullets = generate_experience_bullets(prompt)
            return Response({"responsibilities": bullets})
        if mode == "skills":
            skills = generate_skills(prompt)
            return Response({"skills": skills})
        summary = generate_summary(prompt)
        return Response({"summary": summary})
    except AIGenerationError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class GenerateAIView(APIView):
    """Stateless AI generation that only needs the in-progress form data,
    not a saved CV — used so a brand-new, never-saved CV can still use
    Enhance with AI before the user has clicked Save."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CVGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return _generate_response(
            serializer.validated_data["prompt"], serializer.validated_data["mode"]
        )


MAX_PASSPORT_FILE_BYTES = 10 * 1024 * 1024
MAX_PASSPORT_IMAGES = 2


def _decode_base64_payload(data: str) -> bytes:
    # Frontend sends a data: URI ("data:image/jpeg;base64,...."); strip the
    # header if present so this also tolerates raw base64.
    if data.strip().lower().startswith("data:") and "," in data:
        data = data.split(",", 1)[1]
    try:
        return base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Invalid base64 file data.") from exc


def _to_data_uri(mime_type: str, raw: bytes) -> str:
    return f"data:{mime_type};base64,{base64.b64encode(raw).decode('ascii')}"


def _pdf_pages_to_jpeg(pdf_bytes: bytes, max_pages: int) -> list:
    # Imported lazily, matching the WeasyPrint pattern in exports.py — PDF
    # rendering libraries pull in native dependencies that shouldn't have to
    # load for every request, only when a PDF is actually uploaded.
    import pymupdf

    images = []
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page_index in range(min(len(doc), max_pages)):
            pix = doc.load_page(page_index).get_pixmap(dpi=200)
            images.append(pix.tobytes("jpeg"))
    return images


class ScanPassportView(APIView):
    """Stateless passport bio-data/address page scan — extracts CV fields
    via Gemini vision. Doesn't touch the CV model at all: like
    GenerateAIView, the result is merged into the client's in-progress form
    state, and the user must explicitly confirm it before it's trusted.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PassportScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data["images"]

        gemini_images = []  # [{"mime_type": str, "data": bytes}, ...] sent to Gemini
        stored_images = []  # data-URI strings handed back for the client to store

        for item in uploaded:
            if len(gemini_images) >= MAX_PASSPORT_IMAGES:
                break

            mime_type = item["mime_type"]
            try:
                raw = _decode_base64_payload(item["data"])
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            if len(raw) > MAX_PASSPORT_FILE_BYTES:
                return Response(
                    {"detail": "Each passport file must be under 10MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if mime_type == "application/pdf":
                remaining = MAX_PASSPORT_IMAGES - len(gemini_images)
                try:
                    pages = _pdf_pages_to_jpeg(raw, remaining)
                except Exception:
                    return Response(
                        {
                            "detail": "Could not read that PDF. Please upload a clear scan or "
                            "photo instead."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                for page_bytes in pages:
                    gemini_images.append({"mime_type": "image/jpeg", "data": page_bytes})
                    stored_images.append(_to_data_uri("image/jpeg", page_bytes))
            else:
                gemini_images.append({"mime_type": mime_type, "data": raw})
                stored_images.append(_to_data_uri(mime_type, raw))

        if not gemini_images:
            return Response(
                {"detail": "No usable passport images were provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = scan_passport(gemini_images)
        except AIGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        # Bio-data page first, address page (if any) second — same order the
        # images were uploaded in, so the client can map them straight onto
        # content.passport.scan_image / scan_image_address.
        result["scan_images"] = stored_images
        return Response(result)


class CVViewSet(viewsets.ModelViewSet):
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return CV.objects.filter(owner=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete — the row (and its content) stays in the database for
        # admin visibility; it just drops out of every user-facing queryset
        # above, so the owner sees it as gone.
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["is_deleted", "deleted_at"])

    @action(detail=True, methods=["post"])
    def generate(self, request, pk=None):
        # Ownership check only — the generated text/bullets are handed back
        # to the client to merge into its in-progress form state, not written
        # to the CV here, so an in-flight edit elsewhere on the form can't be
        # clobbered by this call.
        self.get_object()

        serializer = CVGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return _generate_response(
            serializer.validated_data["prompt"], serializer.validated_data["mode"]
        )

    @action(detail=True, methods=["get"], url_path="export/pdf")
    def export_pdf(self, request, pk=None):
        cv = self.get_object()
        pdf_bytes = render_cv_pdf(cv)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{cv.title or "cv"}.pdf"'
        return response

    @action(detail=True, methods=["get"], url_path="export/docx")
    def export_docx(self, request, pk=None):
        cv = self.get_object()
        docx_bytes = render_cv_docx(cv)
        response = HttpResponse(
            docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response["Content-Disposition"] = f'attachment; filename="{cv.title or "cv"}.docx"'
        return response

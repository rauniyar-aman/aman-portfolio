from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .ai import AIGenerationError, generate_experience_bullets, generate_summary
from .exports import render_cv_docx, render_cv_pdf
from .models import CV
from .permissions import IsOwner
from .serializers import CVGenerateSerializer, CVSerializer


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
        prompt = serializer.validated_data["prompt"]
        mode = serializer.validated_data["mode"]

        try:
            if mode == "experience":
                bullets = generate_experience_bullets(prompt)
                return Response({"responsibilities": bullets})
            summary = generate_summary(prompt)
            return Response({"summary": summary})
        except AIGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

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

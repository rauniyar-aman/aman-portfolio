from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .ai import AIGenerationError, generate_cv_content
from .exports import render_cv_docx, render_cv_pdf
from .models import CV
from .permissions import IsOwner
from .serializers import CVGenerateSerializer, CVSerializer


class CVViewSet(viewsets.ModelViewSet):
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return CV.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"])
    def generate(self, request, pk=None):
        cv = self.get_object()
        serializer = CVGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            generated_content = generate_cv_content(serializer.validated_data["prompt"])
        except AIGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        cv.content = generated_content
        cv.save(update_fields=["content", "updated_at"])
        return Response(CVSerializer(cv).data)

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

from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, reverse
from django.utils.html import format_html

from .exports import render_cv_pdf
from .models import CV


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "is_deleted", "created_at", "updated_at", "preview_link")
    list_filter = ("is_deleted", "created_at", "updated_at")
    search_fields = ("title", "owner__username", "owner__email")
    readonly_fields = ("created_at", "updated_at", "deleted_at", "preview_link")
    actions = ["restore_cvs"]

    @admin.action(description="Restore selected CVs (undo user delete)")
    def restore_cvs(self, request, queryset):
        updated = queryset.filter(is_deleted=True).update(is_deleted=False, deleted_at=None)
        self.message_user(request, f"Restored {updated} CV(s).")

    @admin.display(description="Preview")
    def preview_link(self, obj):
        if not obj.pk:
            return "—"
        url = reverse("admin:cvs_cv_preview_pdf", args=[obj.pk])
        return format_html('<a href="{}" target="_blank">Preview PDF</a>', url)

    def get_urls(self):
        custom_urls = [
            path(
                "<int:cv_id>/preview-pdf/",
                self.admin_site.admin_view(self.preview_pdf_view),
                name="cvs_cv_preview_pdf",
            ),
        ]
        return custom_urls + super().get_urls()

    def preview_pdf_view(self, request, cv_id):
        # Any CV, any owner — admin.admin_view() already enforces staff
        # login, and this deliberately bypasses the regular API's per-owner
        # scoping so admin can inspect content the owning user can't see
        # (e.g. a CV they've since soft-deleted).
        cv = self.get_object(request, cv_id)
        pdf_bytes = render_cv_pdf(cv)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{cv.title or "cv"}.pdf"'
        return response

from django.contrib import admin

from .models import CV


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "created_at", "updated_at")
    list_filter = ("created_at", "updated_at")
    search_fields = ("title", "owner__username", "owner__email")
    readonly_fields = ("created_at", "updated_at")

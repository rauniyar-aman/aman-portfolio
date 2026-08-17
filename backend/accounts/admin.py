from django.contrib import admin

from .models import OTPCode


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ("email", "purpose", "code", "is_used", "created_at", "expires_at")
    list_filter = ("purpose", "is_used", "created_at")
    search_fields = ("email", "user__username", "code")
    readonly_fields = ("email", "user", "code", "purpose", "created_at", "expires_at")

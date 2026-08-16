import random
import string
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

OTP_LIFETIME = timedelta(minutes=15)
OTP_LENGTH = 6


def generate_otp_code() -> str:
    return "".join(random.choices(string.digits, k=OTP_LENGTH))


class OTPCode(models.Model):
    class Purpose(models.TextChoices):
        SIGNUP = "signup", "Signup"
        PASSWORD_RESET = "password_reset", "Password Reset"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="otp_codes",
    )
    email = models.EmailField()
    code = models.CharField(max_length=OTP_LENGTH)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["email", "purpose", "is_used"])]

    def __str__(self):
        return f"{self.email} ({self.purpose})"

    @classmethod
    def issue(cls, *, email: str, purpose: str, user=None) -> "OTPCode":
        """Invalidate any unused codes for this email+purpose and issue a
        fresh one, so only the most recently sent code is ever valid."""
        cls.objects.filter(email=email, purpose=purpose, is_used=False).update(is_used=True)
        return cls.objects.create(
            user=user,
            email=email,
            purpose=purpose,
            code=generate_otp_code(),
            expires_at=timezone.now() + OTP_LIFETIME,
        )

    def is_valid(self) -> bool:
        return not self.is_used and timezone.now() < self.expires_at

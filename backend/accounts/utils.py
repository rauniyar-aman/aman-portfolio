from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPCode

User = get_user_model()

RESEND_COOLDOWN_SECONDS = 60
HOURLY_LIMIT = 5


class RateLimitedError(Exception):
    pass


def check_hourly_limit(email: str):
    """Caps total OTPs issued to one email across every purpose combined, at
    5/hour, so signup + resend + password-reset can't be chained to spam an
    inbox."""
    since = timezone.now() - timedelta(hours=1)
    count = OTPCode.objects.filter(email=email, created_at__gte=since).count()
    if count >= HOURLY_LIMIT:
        raise RateLimitedError("Too many code requests for this email. Please try again later.")


def check_resend_cooldown(email: str, purpose: str):
    last = OTPCode.objects.filter(email=email, purpose=purpose).order_by("-created_at").first()
    if last is None:
        return
    elapsed = (timezone.now() - last.created_at).total_seconds()
    if elapsed < RESEND_COOLDOWN_SECONDS:
        wait = int(RESEND_COOLDOWN_SECONDS - elapsed) + 1
        raise RateLimitedError(f"Please wait {wait} seconds before requesting another code.")


def send_otp_email(email: str, code: str, purpose: str):
    if purpose == OTPCode.Purpose.SIGNUP:
        subject = "Verify your email"
        intro = "Use the code below to verify your email and finish creating your account."
        disclaimer = "If you didn't request this code, you can safely ignore this email — no account will be created."
    else:
        subject = "Reset your password"
        intro = "Use the code below to reset your password."
        disclaimer = (
            "If you didn't request this code, you can safely ignore this email — "
            "your password will not be changed."
        )

    context = {
        "subject": subject,
        "heading": subject,
        "intro": intro,
        "code": code,
        "disclaimer": disclaimer,
    }

    text_body = render_to_string("emails/otp_email.txt", context)
    html_body = render_to_string("emails/otp_email.html", context)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


def issue_tokens(user) -> dict:
    refresh = RefreshToken.for_user(user)
    refresh["username"] = user.username
    access = refresh.access_token
    return {"access": str(access), "refresh": str(refresh)}


def get_or_create_social_user(email: str, full_name: str = ""):
    """Used by both Google and Facebook login: find an existing account by
    email (activating it if it was a never-verified signup), or create a new
    active one with no usable password — social login is the only way in
    for that account until they set one via password reset."""
    user = User.objects.filter(email=email).order_by("id").first()
    if user:
        changed = False
        if not user.is_active:
            user.is_active = True
            changed = True
        if full_name and not user.first_name:
            user.first_name = full_name
            changed = True
        if changed:
            user.save()
        return user, False

    user = User(username=email, email=email, first_name=full_name, is_active=True)
    user.set_unusable_password()
    user.save()
    return user, True

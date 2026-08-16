import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OTPCode
from .serializers import (
    FacebookAuthSerializer,
    GoogleAuthSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    ResendOTPSerializer,
    SignupSerializer,
    VerifySignupOTPSerializer,
)
from .utils import (
    RateLimitedError,
    check_hourly_limit,
    check_resend_cooldown,
    get_or_create_social_user,
    issue_tokens,
    send_otp_email,
)

User = get_user_model()


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        full_name = serializer.validated_data["full_name"]
        password = serializer.validated_data["password"]

        existing = User.objects.filter(email=email).order_by("id").first()
        if existing and existing.is_active:
            return Response(
                {"detail": "An account with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            check_hourly_limit(email)
        except RateLimitedError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if existing:
            # Abandoned signup — reuse the inactive account instead of
            # leaving orphaned rows behind for every retry.
            user = existing
            user.first_name = full_name
        else:
            user = User(username=email, email=email, first_name=full_name, is_active=False)
        user.set_password(password)
        user.save()

        otp = OTPCode.issue(email=email, purpose=OTPCode.Purpose.SIGNUP, user=user)
        send_otp_email(email, otp.code, OTPCode.Purpose.SIGNUP)

        return Response(
            {"detail": "Verification code sent to your email."},
            status=status.HTTP_201_CREATED,
        )


class VerifySignupOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifySignupOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]

        otp = (
            OTPCode.objects.filter(
                email=email, purpose=OTPCode.Purpose.SIGNUP, code=code, is_used=False
            )
            .order_by("-created_at")
            .first()
        )
        if otp is None:
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.is_valid():
            return Response(
                {"detail": "Code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = otp.user or User.objects.filter(email=email).order_by("id").first()
        if user is None:
            return Response({"detail": "No pending signup for this email."}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        user.is_active = True
        user.save(update_fields=["is_active"])

        return Response(issue_tokens(user), status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        purpose = serializer.validated_data["purpose"]

        try:
            check_resend_cooldown(email, purpose)
            check_hourly_limit(email)
        except RateLimitedError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if purpose == OTPCode.Purpose.SIGNUP:
            user = User.objects.filter(email=email, is_active=False).order_by("id").first()
            if user is None:
                return Response(
                    {"detail": "No pending signup for this email."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            user = User.objects.filter(email=email, is_active=True).order_by("id").first()
            if user is None:
                # Same "don't leak which emails exist" rule as password
                # reset — report success without actually sending anything.
                return Response({"detail": "Verification code resent."}, status=status.HTTP_200_OK)

        otp = OTPCode.issue(email=email, purpose=purpose, user=user)
        send_otp_email(email, otp.code, purpose)

        return Response({"detail": "Verification code resent."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        generic_response = Response(
            {"detail": "If an account exists for this email, a code has been sent."},
            status=status.HTTP_200_OK,
        )

        user = User.objects.filter(email=email, is_active=True).order_by("id").first()
        if user is None:
            return generic_response

        try:
            check_hourly_limit(email)
        except RateLimitedError:
            # Still don't reveal anything — just silently skip sending.
            return generic_response

        otp = OTPCode.issue(email=email, purpose=OTPCode.Purpose.PASSWORD_RESET, user=user)
        send_otp_email(email, otp.code, OTPCode.Purpose.PASSWORD_RESET)

        return generic_response


class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        new_password = serializer.validated_data["new_password"]

        otp = (
            OTPCode.objects.filter(
                email=email, purpose=OTPCode.Purpose.PASSWORD_RESET, code=code, is_used=False
            )
            .order_by("-created_at")
            .first()
        )
        if otp is None:
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.is_valid():
            return Response(
                {"detail": "Code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = otp.user or User.objects.filter(email=email).order_by("id").first()
        if user is None:
            return Response({"detail": "No account found for this email."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["id_token"]

        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {"detail": "Google sign-in is not configured on the server."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            idinfo = google_id_token.verify_oauth2_token(
                token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo.get("email")
        if not email or not idinfo.get("email_verified", False):
            return Response(
                {"detail": "Google account has no verified email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, _created = get_or_create_social_user(email.strip().lower(), idinfo.get("name", ""))
        return Response(issue_tokens(user), status=status.HTTP_200_OK)


class FacebookLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FacebookAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access_token = serializer.validated_data["access_token"]

        if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
            return Response(
                {"detail": "Facebook sign-in is not configured on the server."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            # Verify the token was actually issued for *our* app before
            # trusting the profile it resolves to — otherwise a token minted
            # for a different Facebook app could be replayed here.
            debug_resp = requests.get(
                "https://graph.facebook.com/debug_token",
                params={
                    "input_token": access_token,
                    "access_token": f"{settings.FACEBOOK_APP_ID}|{settings.FACEBOOK_APP_SECRET}",
                },
                timeout=10,
            )
            debug_data = debug_resp.json().get("data", {})
        except (requests.RequestException, ValueError):
            return Response({"detail": "Could not verify Facebook token."}, status=status.HTTP_502_BAD_GATEWAY)

        if not debug_data.get("is_valid") or str(debug_data.get("app_id")) != str(settings.FACEBOOK_APP_ID):
            return Response({"detail": "Invalid Facebook token."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile_resp = requests.get(
                "https://graph.facebook.com/me",
                params={"fields": "id,name,email", "access_token": access_token},
                timeout=10,
            )
            profile = profile_resp.json()
        except (requests.RequestException, ValueError):
            return Response({"detail": "Could not fetch Facebook profile."}, status=status.HTTP_502_BAD_GATEWAY)

        if "error" in profile:
            return Response({"detail": "Invalid Facebook token."}, status=status.HTTP_400_BAD_REQUEST)

        email = profile.get("email")
        if not email:
            return Response(
                {"detail": "Facebook account has no accessible email. Please use another sign-in method."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, _created = get_or_create_social_user(email.strip().lower(), profile.get("name", ""))
        return Response(issue_tokens(user), status=status.HTTP_200_OK)

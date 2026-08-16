from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import OTPCode


class UsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Embeds the username as a token claim so the frontend can display who's
    logged in without an extra API round trip."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token


class SignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, allow_blank=False, trim_whitespace=True)
    username = serializers.CharField(
        min_length=3, max_length=150, validators=[UnicodeUsernameValidator()]
    )
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        return value.strip()

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class VerifySignupOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.strip().lower()


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=OTPCode.Purpose.choices)

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_new_password(self, value):
        validate_password(value)
        return value


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()


class FacebookAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField()

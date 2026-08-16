from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import OTPCode


class SignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, allow_blank=False, trim_whitespace=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_password(self, value):
        validate_password(value)
        return value


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

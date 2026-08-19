from rest_framework import serializers

from .models import CV


class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model = CV
        fields = ["id", "title", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CVGenerateSerializer(serializers.Serializer):
    prompt = serializers.CharField(allow_blank=False, trim_whitespace=True)
    mode = serializers.ChoiceField(choices=["summary", "experience", "skills"], default="summary")


class PassportScanImageSerializer(serializers.Serializer):
    mime_type = serializers.ChoiceField(
        choices=["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    )
    # Base64, optionally prefixed with a "data:<mime>;base64," URI header —
    # the view strips that header if present.
    data = serializers.CharField(allow_blank=False)


class PassportScanSerializer(serializers.Serializer):
    images = PassportScanImageSerializer(many=True, min_length=1, max_length=2)

from rest_framework import serializers

from .models import CV


class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model = CV
        fields = ["id", "title", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CVGenerateSerializer(serializers.Serializer):
    prompt = serializers.CharField(allow_blank=False, trim_whitespace=True)

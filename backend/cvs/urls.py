from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CVViewSet, GenerateAIView

router = DefaultRouter()
router.register(r"cvs", CVViewSet, basename="cv")

urlpatterns = [
    path("cvs/generate/", GenerateAIView.as_view(), name="cv-generate"),
] + router.urls

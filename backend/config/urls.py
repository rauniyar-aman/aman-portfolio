from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import UsernameTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", UsernameTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("cvs.urls")),
]

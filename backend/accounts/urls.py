from django.urls import path

from . import views

urlpatterns = [
    path("signup/", views.SignupView.as_view(), name="signup"),
    path("signup/verify/", views.VerifySignupOTPView.as_view(), name="signup_verify"),
    path("signup/resend-otp/", views.ResendOTPView.as_view(), name="signup_resend_otp"),
    path("password-reset/request/", views.PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("password-reset/verify/", views.PasswordResetVerifyView.as_view(), name="password_reset_verify"),
    path("google/", views.GoogleLoginView.as_view(), name="google_login"),
    path("facebook/", views.FacebookLoginView.as_view(), name="facebook_login"),
]

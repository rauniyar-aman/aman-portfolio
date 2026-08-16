from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Allows access only to the object's owner."""

    def has_object_permission(self, request, view, obj):
        return obj.owner_id == request.user.id

from django.core.management.base import BaseCommand

from cvs.models import CV


def _as_str(value) -> str:
    return value if isinstance(value, str) else ""


class Command(BaseCommand):
    help = (
        "One-off cleanup for CVs saved before the frontend fix: clears "
        "content.passport.scan_image/scan_image_address (base64 passport photos that used "
        "to be persisted on every save) wherever they're non-empty. Safe to run more than "
        "once — a no-op once there's nothing left to clear."
    )

    def handle(self, *args, **options):
        cleaned = 0
        bytes_reclaimed = 0

        for cv in CV.objects.all().iterator():
            passport = (cv.content or {}).get("passport")
            if not isinstance(passport, dict):
                continue

            scan_image = _as_str(passport.get("scan_image"))
            scan_image_address = _as_str(passport.get("scan_image_address"))
            if not scan_image and not scan_image_address:
                continue

            bytes_reclaimed += len(scan_image.encode("utf-8")) + len(
                scan_image_address.encode("utf-8")
            )
            passport["scan_image"] = ""
            passport["scan_image_address"] = ""
            # update_fields=["content"] deliberately leaves updated_at alone — this is a
            # silent backend cleanup, not a user edit, and CVs are listed newest-updated
            # first, so touching it would make every cleaned CV jump to the top of the
            # owner's dashboard for no reason they'd understand.
            cv.save(update_fields=["content"])
            cleaned += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Cleaned {cleaned} CV(s), reclaimed {bytes_reclaimed:,} bytes "
                f"({bytes_reclaimed / 1024 / 1024:.2f} MB)."
            )
        )

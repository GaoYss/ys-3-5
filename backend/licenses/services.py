from django.db.models import Count
from django.utils import timezone

from .models import BorrowRecord, License


def refresh_license_status(license_obj):
    computed_status = license_obj.computed_status
    if license_obj.status != computed_status:
        license_obj.status = computed_status
        license_obj.save(update_fields=["status", "updated_at"])
    return license_obj


def refresh_borrow_status(record):
    computed_status = record.computed_status
    if record.status != computed_status:
        record.status = computed_status
        record.save(update_fields=["status", "updated_at"])
    return record


def dashboard_stats():
    today = timezone.localdate()
    licenses_qs = License.objects.all()
    licenses = list(licenses_qs)
    for license_obj in licenses:
        refresh_license_status(license_obj)

    borrow_records = list(BorrowRecord.objects.filter(status__in=[BorrowRecord.Status.BORROWED, BorrowRecord.Status.OVERDUE]))
    for record in borrow_records:
        refresh_borrow_status(record)

    status_counts = dict(licenses_qs.values_list("status").annotate(total=Count("id")))
    type_counts = dict(licenses_qs.values_list("license_type").annotate(total=Count("id")))
    department_counts = dict(licenses_qs.values_list("owner_department").annotate(total=Count("id")))

    cross_data = {}
    for item in licenses_qs.values("license_type", "owner_department").annotate(total=Count("id")):
        license_type = item["license_type"]
        dept = item["owner_department"]
        if license_type not in cross_data:
            cross_data[license_type] = {}
        cross_data[license_type][dept] = item["total"]

    departments = sorted(department_counts.keys())
    license_types = [choice[0] for choice in License.LicenseType.choices]

    cross_matrix = []
    for lt in license_types:
        row = {"license_type": lt}
        for dept in departments:
            row[dept] = cross_data.get(lt, {}).get(dept, 0)
        row["total"] = sum(cross_data.get(lt, {}).values())
        cross_matrix.append(row)

    dept_totals = {"license_type": "__total__"}
    for dept in departments:
        dept_totals[dept] = department_counts.get(dept, 0)
    dept_totals["total"] = len(licenses)

    return {
        "total_licenses": licenses_qs.count(),
        "active_licenses": status_counts.get(License.Status.ACTIVE, 0),
        "expiring_licenses": status_counts.get(License.Status.EXPIRING, 0),
        "expired_licenses": status_counts.get(License.Status.EXPIRED, 0),
        "borrowed_records": BorrowRecord.objects.filter(status=BorrowRecord.Status.BORROWED).count(),
        "overdue_returns": BorrowRecord.objects.filter(status=BorrowRecord.Status.OVERDUE).count(),
        "by_type": type_counts,
        "by_department": department_counts,
        "departments": departments,
        "cross_matrix": cross_matrix,
        "cross_totals": dept_totals,
        "all_licenses": licenses,
        "upcoming_expiries": licenses_qs.filter(expiry_date__gte=today).order_by("expiry_date")[:8],
        "expired": licenses_qs.filter(expiry_date__lt=today).order_by("expiry_date")[:8],
    }

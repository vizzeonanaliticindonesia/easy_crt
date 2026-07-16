type TenantOwnedItem = {
    school_id?: string | number | null;
    teacher_id?: string | number | null;
    payer_school_id?: string | number | null;
};

export function filterTenantOwnedItems<T extends TenantOwnedItem>(
    items: T[],
    tenantId?: string | number | null
): T[] {
    if (!tenantId) {
        return [];
    }

    return items.filter((item) => {
        return (
            (item.school_id != null &&
                String(item.school_id) === String(tenantId)) ||

            (item.teacher_id != null &&
                String(item.teacher_id) === String(tenantId)) ||

            (item.payer_school_id != null &&
                String(item.payer_school_id) === String(tenantId))
        );
    });
}

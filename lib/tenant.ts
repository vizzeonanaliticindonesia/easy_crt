type SchoolOwnedItem = {
    school_id?: string | number | null;
    payer_school_id?: string | number | null;
};

type TeacherOwnedItem = {
    teacher_id?: string | number | null;
};

export function filterSchoolOwnedItems<T extends SchoolOwnedItem>(
    items: T[],
    schoolId?: string | number | null
): T[] {
    if (!schoolId) {
        return [];
    }

    const id = String(schoolId);
    return items.filter((item) => {
        return (
            (item.school_id != null && String(item.school_id) === id) ||
            (item.payer_school_id != null && String(item.payer_school_id) === id)
        );
    });
}

export function filterTeacherOwnedItems<T extends TeacherOwnedItem>(
    items: T[],
    teacherId?: string | number | null
): T[] {
    if (!teacherId) {
        return [];
    }

    const id = String(teacherId);
    return items.filter((item) => item.teacher_id != null && String(item.teacher_id) === id);
}

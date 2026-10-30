package com.resolvenow.complaint;

public enum ComplaintDepartment {
    IT,
    HR,
    FINANCE,
    OPERATIONS;

    public static ComplaintDepartment fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        for (ComplaintDepartment department : values()) {
            if (department.name().equalsIgnoreCase(value.trim())) {
                return department;
            }
        }

        return null;
    }
}

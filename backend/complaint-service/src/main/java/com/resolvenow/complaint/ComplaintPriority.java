package com.resolvenow.complaint;

public enum ComplaintPriority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    public static ComplaintPriority fromValue(String value) {
        if (value == null || value.isBlank()) {
            return MEDIUM;
        }
        for (ComplaintPriority priority : values()) {
            if (priority.name().equalsIgnoreCase(value.trim())) {
                return priority;
            }
        }
        return MEDIUM;
    }
}

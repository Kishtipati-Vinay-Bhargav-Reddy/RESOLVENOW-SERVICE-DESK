package com.resolvenow.assignment;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum AssignmentStatus {
    ASSIGNED,
    IN_PROGRESS,
    COMPLETED;

    private static final Map<AssignmentStatus, Set<AssignmentStatus>> VALID_TRANSITIONS = Map.of(
            ASSIGNED, EnumSet.of(IN_PROGRESS, COMPLETED),
            IN_PROGRESS, EnumSet.of(COMPLETED),
            COMPLETED, EnumSet.noneOf(AssignmentStatus.class)
    );

    public boolean canTransitionTo(AssignmentStatus targetStatus) {
        return VALID_TRANSITIONS.getOrDefault(this, EnumSet.noneOf(AssignmentStatus.class)).contains(targetStatus);
    }

    public static AssignmentStatus fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        for (AssignmentStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim()) || status.name().replace("_", " ").equalsIgnoreCase(value.trim())) {
                return status;
            }
        }

        return null;
    }
}

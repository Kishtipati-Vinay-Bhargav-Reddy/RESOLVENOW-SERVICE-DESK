package com.resolvenow.complaint;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum ComplaintStatus {
    OPEN,
    ASSIGNED,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    private static final Map<ComplaintStatus, Set<ComplaintStatus>> VALID_TRANSITIONS = Map.of(
            OPEN, EnumSet.of(ASSIGNED),
            ASSIGNED, EnumSet.of(IN_PROGRESS),
            IN_PROGRESS, EnumSet.of(RESOLVED),
            RESOLVED, EnumSet.of(CLOSED),
            CLOSED, EnumSet.noneOf(ComplaintStatus.class)
    );

    public boolean canTransitionTo(ComplaintStatus targetStatus) {
        return VALID_TRANSITIONS.getOrDefault(this, EnumSet.noneOf(ComplaintStatus.class)).contains(targetStatus);
    }

    public static ComplaintStatus fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        for (ComplaintStatus status : values()) {
            if (status.name().equalsIgnoreCase(value.trim()) || status.name().replace("_", " ").equalsIgnoreCase(value.trim())) {
                return status;
            }
        }

        return null;
    }
}

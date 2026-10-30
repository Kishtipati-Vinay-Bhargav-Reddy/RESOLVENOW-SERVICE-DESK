package com.resolvenow.complaint.dto;

import java.util.Map;

public record ComplaintStatsResponse(
        long totalComplaints,
        Map<String, Long> statusCounts,
        Map<String, Long> departmentCounts,
        Map<String, Long> priorityCounts,
        long overdueCount,
        long escalatedCount
) {
}

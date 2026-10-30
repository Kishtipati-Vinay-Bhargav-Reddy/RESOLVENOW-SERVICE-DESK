package com.resolvenow.complaint.repository;

import com.resolvenow.complaint.ComplaintHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintHistoryRepository extends JpaRepository<ComplaintHistory, Long> {
    List<ComplaintHistory> findByComplaintIdOrderByChangedAtAsc(Long complaintId);
}

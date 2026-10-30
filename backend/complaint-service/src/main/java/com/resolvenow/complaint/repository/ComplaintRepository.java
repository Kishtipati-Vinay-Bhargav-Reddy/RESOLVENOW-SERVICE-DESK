package com.resolvenow.complaint.repository;

import com.resolvenow.complaint.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<Complaint> findAllByOrderByUpdatedAtDesc();
}
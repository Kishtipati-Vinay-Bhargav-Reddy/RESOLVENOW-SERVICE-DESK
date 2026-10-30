package com.resolvenow.assignment.repository;

import com.resolvenow.assignment.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    boolean existsByComplaintId(Long complaintId);
    Optional<Assignment> findByComplaintId(Long complaintId);
    List<Assignment> findByComplaintOwnerUserIdOrderByUpdatedAtDesc(Long complaintOwnerUserId);
    List<Assignment> findByComplaintOwnerUserIdOrAssignedToOrderByUpdatedAtDesc(Long complaintOwnerUserId, String assignedTo);
    List<Assignment> findAllByOrderByUpdatedAtDesc();
}
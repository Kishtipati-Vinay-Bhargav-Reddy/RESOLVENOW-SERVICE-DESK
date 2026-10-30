package com.resolvenow.complaint.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ComplaintOutboxRepository extends JpaRepository<ComplaintOutboxEvent, Long> {

    List<ComplaintOutboxEvent> findTop20ByStatusInAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            List<String> statuses, Instant cutoff);

    Optional<ComplaintOutboxEvent> findByEventId(String eventId);

    long countByStatus(String status);

    List<ComplaintOutboxEvent> findByComplaintId(Long complaintId);
}

package com.resolvenow.assignment.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AssignmentOutboxRepository extends JpaRepository<AssignmentOutboxEvent, Long> {

    List<AssignmentOutboxEvent> findTop20ByStatusInAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            List<String> statuses, Instant cutoff);

    Optional<AssignmentOutboxEvent> findByEventId(String eventId);

    long countByStatus(String status);
}

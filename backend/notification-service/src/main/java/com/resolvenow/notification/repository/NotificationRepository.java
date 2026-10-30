package com.resolvenow.notification.repository;

import com.resolvenow.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	List<Notification> findAllByUserIdOrderByCreatedAtDesc(Long userId);

	long countByUserIdAndReadStatusFalse(Long userId);

	Optional<Notification> findByEventId(String eventId);

	boolean existsByEventId(String eventId);

	@Modifying
	@Query("update Notification n set n.readStatus = true, n.readAt = :readAt " +
			"where n.userId = :userId and n.readStatus = false")
	int markAllReadByUserId(@Param("userId") Long userId, @Param("readAt") Instant readAt);
}
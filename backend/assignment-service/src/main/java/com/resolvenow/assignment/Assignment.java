package com.resolvenow.assignment;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "assignment")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", nullable = false)
    private Long complaintId;

    @Column(name = "complaint_owner_user_id")
    private Long complaintOwnerUserId;

    @Column(name = "complaint_owner_username")
    private String complaintOwnerUsername;

    @Column(nullable = false)
    private String department;

    @Column(name = "assigned_to", nullable = false)
    private String assignedTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public Assignment() {
    }

    public Assignment(Long complaintId, Long complaintOwnerUserId, String complaintOwnerUsername,
                      String department, String assignedTo, AssignmentStatus status) {
        this.complaintId = complaintId;
        this.complaintOwnerUserId = complaintOwnerUserId;
        this.complaintOwnerUsername = complaintOwnerUsername;
        this.department = department;
        this.assignedTo = assignedTo;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(Long complaintId) {
        this.complaintId = complaintId;
    }

    public Long getComplaintOwnerUserId() {
        return complaintOwnerUserId;
    }

    public void setComplaintOwnerUserId(Long complaintOwnerUserId) {
        this.complaintOwnerUserId = complaintOwnerUserId;
    }

    public String getComplaintOwnerUsername() {
        return complaintOwnerUsername;
    }

    public void setComplaintOwnerUsername(String complaintOwnerUsername) {
        this.complaintOwnerUsername = complaintOwnerUsername;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public AssignmentStatus getStatus() {
        return status;
    }

    public void setStatus(AssignmentStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

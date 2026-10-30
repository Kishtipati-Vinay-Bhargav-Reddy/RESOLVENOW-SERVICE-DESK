package com.resolvenow.complaint.controller;

import com.resolvenow.complaint.dto.ComplaintHistoryResponse;
import com.resolvenow.complaint.dto.ComplaintResponse;
import com.resolvenow.complaint.dto.ComplaintStatsResponse;
import com.resolvenow.complaint.dto.CreateComplaintRequest;
import com.resolvenow.complaint.dto.EscalateComplaintRequest;
import com.resolvenow.complaint.dto.UpdateComplaintStatusRequest;
import com.resolvenow.complaint.security.AuthenticatedUser;
import com.resolvenow.complaint.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            Authentication authentication) {

        AuthenticatedUser currentUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(
                complaintService.createComplaint(request, currentUser.userId(), currentUser.username())
        );
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(Authentication authentication) {
        AuthenticatedUser currentUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(complaintService.getAllComplaints(currentUser.userId(), currentUser.role()));
    }

    @GetMapping("/stats")
    public ResponseEntity<ComplaintStatsResponse> getComplaintStats(Authentication authentication) {
        AuthenticatedUser currentUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(complaintService.getComplaintStats(currentUser.userId(), currentUser.role()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaintById(@PathVariable Long id, Authentication authentication) {
        AuthenticatedUser currentUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(complaintService.getComplaintById(id, currentUser.userId(), currentUser.role()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateComplaintStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComplaintStatusRequest request,
            Authentication authentication) {

        AuthenticatedUser currentUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(
                complaintService.updateComplaintStatus(id, request, currentUser.userId(), currentUser.role(), currentUser.username())
        );
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<ComplaintResponse> escalateComplaint(
            @PathVariable Long id,
            @Valid @RequestBody EscalateComplaintRequest request,
            Authentication authentication) {

        AuthenticatedUser currentUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(
                complaintService.escalateComplaint(id, request, currentUser.userId(), currentUser.role(), currentUser.username())
        );
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ComplaintHistoryResponse>> getComplaintHistory(@PathVariable Long id, Authentication authentication) {
        AuthenticatedUser currentUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(complaintService.getComplaintHistory(id, currentUser.userId(), currentUser.role()));
    }
}

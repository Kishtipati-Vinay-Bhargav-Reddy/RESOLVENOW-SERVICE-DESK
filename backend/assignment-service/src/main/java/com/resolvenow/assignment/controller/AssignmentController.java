package com.resolvenow.assignment.controller;

import com.resolvenow.assignment.dto.AssignmentResponse;
import com.resolvenow.assignment.dto.CreateAssignmentRequest;
import com.resolvenow.assignment.dto.UpdateAssignmentRequest;
import com.resolvenow.assignment.security.AuthenticatedUser;
import com.resolvenow.assignment.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    public ResponseEntity<AssignmentResponse> createAssignment(
            @Valid @RequestBody CreateAssignmentRequest request,
            Authentication authentication) {

        AuthenticatedUser currentUser = getCurrentUserOrNull(authentication);
        if (currentUser != null && !isStaffOrAdmin(currentUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only staff or admin users can create assignments");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(request, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getAllAssignments(Authentication authentication) {
        AuthenticatedUser currentUser = requireCurrentUser(authentication);
        return ResponseEntity.ok(assignmentService.getAssignmentsForUser(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentResponse> getAssignmentById(@PathVariable Long id, Authentication authentication) {
        AuthenticatedUser currentUser = requireCurrentUser(authentication);
        return ResponseEntity.ok(assignmentService.getAssignmentById(id, currentUser));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AssignmentResponse> updateAssignment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAssignmentRequest request,
            Authentication authentication) {

        AuthenticatedUser currentUser = requireCurrentUser(authentication);
        return ResponseEntity.ok(assignmentService.updateAssignment(id, request, currentUser));
    }

    private AuthenticatedUser requireCurrentUser(Authentication authentication) {
        AuthenticatedUser currentUser = getCurrentUserOrNull(authentication);
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return currentUser;
    }

    private AuthenticatedUser getCurrentUserOrNull(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser principal) {
            return principal;
        }

        Authentication securityAuthentication = SecurityContextHolder.getContext().getAuthentication();
        if (securityAuthentication != null && securityAuthentication.getPrincipal() instanceof AuthenticatedUser principal) {
            return principal;
        }

        return null;
    }

    private boolean isStaffOrAdmin(String role) {
        if (role == null) {
            return false;
        }
        String normalized = role.toUpperCase();
        return "ADMIN".equals(normalized) || "STAFF".equals(normalized)
                || "ROLE_ADMIN".equals(normalized) || "ROLE_STAFF".equals(normalized);
    }
}
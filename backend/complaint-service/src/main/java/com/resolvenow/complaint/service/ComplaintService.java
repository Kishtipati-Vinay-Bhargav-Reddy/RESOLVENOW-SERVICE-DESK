package com.resolvenow.complaint.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.resolvenow.complaint.Complaint;
import com.resolvenow.complaint.repository.ComplaintRepository;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final RestTemplate restTemplate;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            RestTemplate restTemplate) {

        this.complaintRepository = complaintRepository;
        this.restTemplate = restTemplate;
    }

    public Complaint createComplaint(Complaint complaint) {

        if (complaint.getStatus() == null || complaint.getStatus().isBlank()) {
            complaint.setStatus("OPEN");
        }

        // Save complaint
        Complaint savedComplaint = complaintRepository.save(complaint);

        // Automatically create assignment
        restTemplate.postForEntity(
                "http://ASSIGNMENT-SERVICE/api/assignments",
                Map.of(
                        "complaintId", savedComplaint.getId(),
                        "department", savedComplaint.getDepartment(),
                        "assignedTo", "admin",
                        "status", "ASSIGNED"
                ),
                Void.class
        );

        return savedComplaint;
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public Complaint getComplaintById(Long id) {
        return complaintRepository.findById(id).orElse(null);
    }
}
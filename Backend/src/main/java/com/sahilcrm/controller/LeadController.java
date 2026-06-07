package com.sahilcrm.controller;

import com.sahilcrm.entity.Lead;
import com.sahilcrm.entity.User;
import com.sahilcrm.repository.LeadRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadRepository leadRepository;

    @GetMapping
    public ResponseEntity<List<Lead>> getAllLeads(@AuthenticationPrincipal UserDetails principal) {
        boolean isCounselor = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + User.Role.COUNSELOR.name()));
        List<Lead> leads = isCounselor
                ? leadRepository.findByAssignedToEmail(principal.getUsername())
                : leadRepository.findAll();
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lead> getLead(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails principal) {
        return leadRepository.findById(id)
                .filter(lead -> canAccessLead(lead, principal))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/counselor/{counselorId}")
    public ResponseEntity<List<Lead>> getLeadsByCounselor(@PathVariable Long counselorId) {
        return ResponseEntity.ok(leadRepository.findByAssignedToId(counselorId));
    }

    @GetMapping("/stage/{stage}")
    public ResponseEntity<List<Lead>> getLeadsByStage(@PathVariable Lead.Stage stage) {
        return ResponseEntity.ok(leadRepository.findByStage(stage));
    }

    @PostMapping
    public ResponseEntity<Lead> createLead(@Valid @RequestBody Lead lead) {
        lead.setId(null);
        return ResponseEntity.ok(leadRepository.save(lead));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lead> updateLead(@PathVariable Long id,
                                           @Valid @RequestBody Lead lead,
                                           @AuthenticationPrincipal UserDetails principal) {
        return leadRepository.findById(id)
                .filter(existing -> canAccessLead(existing, principal))
                .map(existing -> {
                    lead.setId(id);
                    return ResponseEntity.ok(leadRepository.save(lead));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLead(@PathVariable Long id) {
        if (!leadRepository.existsById(id)) return ResponseEntity.notFound().build();
        leadRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean canAccessLead(Lead lead, UserDetails principal) {
        boolean isCounselor = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + User.Role.COUNSELOR.name()));
        if (!isCounselor) return true;
        return lead.getAssignedTo() != null &&
               lead.getAssignedTo().getEmail().equals(principal.getUsername());
    }
}

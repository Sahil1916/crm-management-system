package com.sahilcrm.controller;

import com.sahilcrm.entity.FollowUp;
import com.sahilcrm.repository.FollowUpRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/followups")
@RequiredArgsConstructor
public class FollowUpController {

    private final FollowUpRepository followUpRepository;

    @GetMapping
    public ResponseEntity<List<FollowUp>> getAllFollowUps() {
        return ResponseEntity.ok(followUpRepository.findAll());
    }

    @GetMapping("/counselor/{counselorId}")
    public ResponseEntity<List<FollowUp>> getFollowUpsByCounselor(@PathVariable Long counselorId) {
        return ResponseEntity.ok(followUpRepository.findByCounselorId(counselorId));
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<FollowUp>> getFollowUpsByLead(@PathVariable Long leadId) {
        return ResponseEntity.ok(followUpRepository.findByLeadId(leadId));
    }

    @PostMapping
    public ResponseEntity<FollowUp> createFollowUp(@Valid @RequestBody FollowUp followUp) {
        followUp.setId(null);
        return ResponseEntity.ok(followUpRepository.save(followUp));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FollowUp> updateFollowUp(@PathVariable Long id,
                                                    @Valid @RequestBody FollowUp followUp) {
        return followUpRepository.findById(id).map(existing -> {
            if (followUp.getLead() != null) existing.setLead(followUp.getLead());
            if (followUp.getCounselor() != null) existing.setCounselor(followUp.getCounselor());
            if (followUp.getScheduledDate() != null) existing.setScheduledDate(followUp.getScheduledDate());
            if (followUp.getNotes() != null) existing.setNotes(followUp.getNotes());
            if (followUp.getStatus() != null) existing.setStatus(followUp.getStatus());
            return ResponseEntity.ok(followUpRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFollowUp(@PathVariable Long id) {
        if (!followUpRepository.existsById(id)) return ResponseEntity.notFound().build();
        followUpRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

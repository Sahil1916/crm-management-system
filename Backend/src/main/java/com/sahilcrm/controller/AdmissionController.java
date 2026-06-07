package com.sahilcrm.controller;

import com.sahilcrm.entity.Admission;
import com.sahilcrm.repository.AdmissionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admissions")
@RequiredArgsConstructor
public class AdmissionController {

    private final AdmissionRepository admissionRepository;

    @GetMapping
    public ResponseEntity<List<Admission>> getAllAdmissions() {
        return ResponseEntity.ok(admissionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Admission> getAdmission(@PathVariable Long id) {
        return admissionRepository.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<Admission> getAdmissionByLead(@PathVariable Long leadId) {
        return admissionRepository.findByLeadId(leadId).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Admission> createAdmission(@Valid @RequestBody Admission admission) {
        admission.setId(null);
        return ResponseEntity.ok(admissionRepository.save(admission));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Admission> updateAdmission(@PathVariable Long id,
                                                      @Valid @RequestBody Admission admission) {
        if (!admissionRepository.existsById(id)) return ResponseEntity.notFound().build();
        admission.setId(id);
        return ResponseEntity.ok(admissionRepository.save(admission));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdmission(@PathVariable Long id) {
        if (!admissionRepository.existsById(id)) return ResponseEntity.notFound().build();
        admissionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

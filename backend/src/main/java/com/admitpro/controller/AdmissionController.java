package com.admitpro.controller;

import com.admitpro.dto.request.AdmissionRequest;
import com.admitpro.dto.response.ApiResponse;
import com.admitpro.service.AdmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

// ─── AdmissionController ─────────────────────────────────────────────────────
@RestController
@RequestMapping("/admissions")
@RequiredArgsConstructor
public class AdmissionController {
    private final AdmissionService admissionService;

    private String extractRole(UserDetails ud) {
        return ud.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("COUNSELLOR");
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR','TRAINER','STUDENT')")
    public ResponseEntity<?> getAll(@AuthenticationPrincipal UserDetails ud,
                                    @RequestParam(defaultValue = "0")  int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                admissionService.findForUser(ud.getUsername(), page, size)
        ));
    }

    // GET converted enquiries for admission page
    @GetMapping("/converted-leads")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> getConvertedLeads(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(
                admissionService.getConvertedEnquiries(ud.getUsername(), extractRole(ud))
        ));
    }

    // FIX 3: create no longer requires studentId — creates/finds student from enquiry
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> create(@Valid @RequestBody AdmissionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admission confirmed", admissionService.create(req)));
    }

    // Update payment
    @PatchMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> updatePayment(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        BigDecimal feePaid = new BigDecimal(body.getOrDefault("feePaid", "0"));
        return ResponseEntity.ok(ApiResponse.success(
                "Payment updated", admissionService.updatePayment(id, feePaid)
        ));
    }

    @PatchMapping("/{id}/assign-trainer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTrainer(@PathVariable Long id,
                                           @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(ApiResponse.success(
                "Trainer assigned", admissionService.assignTrainer(id, body.get("trainerId"))
        ));
    }
}

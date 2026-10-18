package com.admitpro.controller;

import com.admitpro.dto.request.AssignCounsellorRequest;
import com.admitpro.dto.request.EnquiryRequest;
import com.admitpro.dto.request.UpdateStatusRequest;
import com.admitpro.dto.response.ApiResponse;
import com.admitpro.dto.response.EnquiryResponse;
import com.admitpro.dto.response.PagedResponse;
import com.admitpro.model.Enquiry;
import com.admitpro.service.EnquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// ─── EnquiryController ───────────────────────────────────────────────────────
@RestController
@RequestMapping("/enquiries")
@RequiredArgsConstructor
public class EnquiryController {

    private final EnquiryService enquiryService;

    // Helper: extract role string from JWT
    private String extractRole(UserDetails ud) {
        return ud.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("COUNSELLOR");
    }

    // FIX 1: passes currentUserEmail + currentUserRole so backend
    //        auto-filters counsellors to their own leads only
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Enquiry.Status   status,
            @RequestParam(required = false) Enquiry.Priority priority,
            @RequestParam(required = false) Long             counsellorId,
            @RequestParam(required = false) String           search,
            @RequestParam(defaultValue = "0")   int  page,
            @RequestParam(defaultValue = "20")  int  size,
            @RequestParam(defaultValue = "enquiryDate") String sort,
            @AuthenticationPrincipal UserDetails ud) {

        var result = enquiryService.findAll(
                status, priority, counsellorId, search, page, size, sort,
                ud.getUsername(), extractRole(ud)
        );
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.map(EnquiryResponse::from))
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                EnquiryResponse.from(enquiryService.findById(id))
        ));
    }

    // FIX 2: Counsellors CAN create enquiries — @PreAuthorize allows both roles
    // When counsellor creates, their own ID is auto-set as counsellorId
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> create(
            @Valid @RequestBody EnquiryRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        Enquiry enquiry = enquiryService.create(
                req.getLeadName(), req.getPhone(), req.getEmail(),
                req.getCourseId(), req.getCounsellorId(),
                req.getSource(), req.getRemarks(), req.getPriority(),
                ud.getUsername (), extractRole(ud)  // pass who is creating
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Enquiry created", EnquiryResponse.from(enquiry)));
    }

    // FIX 1: passes user context so counsellors can only update their own leads
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        Enquiry updated = enquiryService.updateStatus(
                id, req.getStatus(),
                ud.getUsername(), extractRole(ud)
        );
        return ResponseEntity.ok(ApiResponse.success(EnquiryResponse.from(updated)));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assign(@PathVariable Long id,
                                    @Valid @RequestBody AssignCounsellorRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
                EnquiryResponse.from(enquiryService.assignCounsellor(id, req.getCounsellorId()))
        ));
    }

    // Admin global stats
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(ApiResponse.success(enquiryService.getDashboardStats()));
    }

    // Counsellor personal stats (their leads only) — FIX: new endpoint
    @GetMapping("/my-stats")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> myStats(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.success(
                enquiryService.getCounsellorStats(ud.getUsername())
        ));
    }
}

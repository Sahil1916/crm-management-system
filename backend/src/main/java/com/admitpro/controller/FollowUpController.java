package com.admitpro.controller;

import com.admitpro.dto.request.FollowUpRequest;
import com.admitpro.dto.response.ApiResponse;
import com.admitpro.service.FollowUpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// ─── FollowUpController ───────────────────────────────────────────────────────
@RestController
@RequestMapping("/enquiries/{enquiryId}/followups")
@RequiredArgsConstructor
public class FollowUpController {
    private final FollowUpService followUpService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> getAll(@PathVariable Long enquiryId) {
        return ResponseEntity.ok(ApiResponse.success(followUpService.getByEnquiry(enquiryId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> create(@PathVariable Long enquiryId,
                                    @Valid @RequestBody FollowUpRequest req,
                                    @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        followUpService.create(enquiryId, req, ud.getUsername())));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> complete(@PathVariable Long enquiryId, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(followUpService.markDone(id)));
    }
}

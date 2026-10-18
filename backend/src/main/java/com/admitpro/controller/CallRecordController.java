package com.admitpro.controller;

import com.admitpro.dto.request.CallRecordRequest;
import com.admitpro.dto.response.ApiResponse;
import com.admitpro.service.CallRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// ─── CallRecordController ─────────────────────────────────────────────────────
@RestController
@RequestMapping("/enquiries/{enquiryId}/calls")
@RequiredArgsConstructor
public class CallRecordController {
    private final CallRecordService callRecordService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> getAll(@PathVariable Long enquiryId) {
        return ResponseEntity.ok(ApiResponse.success(callRecordService.getByEnquiry(enquiryId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COUNSELLOR')")
    public ResponseEntity<?> create(@PathVariable Long enquiryId,
                                    @Valid @RequestBody CallRecordRequest req,
                                    @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        callRecordService.create(enquiryId, req, ud.getUsername())));
    }
}

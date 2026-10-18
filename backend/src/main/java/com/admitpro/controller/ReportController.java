package com.admitpro.controller;

import com.admitpro.dto.response.ApiResponse;
import com.admitpro.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// ─── ReportController ─────────────────────────────────────────────────────────
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @GetMapping("/admissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> admissionsReport(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "json") String format) {
        return ResponseEntity.ok(ApiResponse.success(reportService.admissionsReport(from, to, format)));
    }

    @GetMapping("/counsellor-performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> counsellorPerformance() {
        return ResponseEntity.ok(ApiResponse.success(reportService.counsellorPerformance()));
    }

    @GetMapping("/lead-conversion")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> leadConversion() {
        return ResponseEntity.ok(ApiResponse.success(reportService.leadConversion()));
    }
}

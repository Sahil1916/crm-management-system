package com.admitpro.controller;

import com.admitpro.dto.request.AttendanceBulkRequest;
import com.admitpro.dto.response.ApiResponse;
import com.admitpro.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// ─── AttendanceController ─────────────────────────────────────────────────────
@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public ResponseEntity<?> get(@RequestParam(required = false) Long   trainerId,
                                 @RequestParam(required = false) String date) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.get(trainerId, date)));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER')")
    public ResponseEntity<?> markBulk(@Valid @RequestBody AttendanceBulkRequest req,
                                      @AuthenticationPrincipal UserDetails ud) {
        attendanceService.markBulk(req, ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Attendance marked", null));
    }

    @GetMapping("/student/{studentId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN','TRAINER','STUDENT')")
    public ResponseEntity<?> summary(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getSummary(studentId)));
    }
}

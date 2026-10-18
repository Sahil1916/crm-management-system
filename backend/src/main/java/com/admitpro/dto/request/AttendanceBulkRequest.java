package com.admitpro.dto.request;

import com.admitpro.model.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceBulkRequest {
    @NotNull public LocalDate date;
    @NotNull public List<AttendanceEntry> entries;

    @Data
    public static class AttendanceEntry {
        @NotNull public Long studentId;
        @NotNull public Attendance.AttendanceStatus status;
    }
}


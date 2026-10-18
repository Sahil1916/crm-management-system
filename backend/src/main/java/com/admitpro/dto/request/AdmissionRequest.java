package com.admitpro.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AdmissionRequest {

    @NotNull(message = "Enquiry ID is required")
    private Long enquiryId;

    // FIX: studentId is now OPTIONAL.
    // If null → system auto-creates a STUDENT user from the enquiry's
    // lead name, phone, and email. This prevents "Super Admin" appearing
    // as the student name.
    private Long studentId;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    // Optional — can be assigned later
    private Long trainerId;

    // Optional — defaults to 0 (PENDING) if null
    private BigDecimal feePaid;

    // Optional — defaults to today if null
    private LocalDate admissionDate;
}
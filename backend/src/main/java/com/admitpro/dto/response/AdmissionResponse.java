package com.admitpro.dto.response;

import com.admitpro.model.Admission;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdmissionResponse {

    // Admission record
    private Long      id;
    private LocalDate admissionDate;
    private LocalDateTime createdAt;

    // Payment info
    private BigDecimal feePaid;
    private BigDecimal courseFee;
    private BigDecimal balanceDue;
    private String     paymentStatus;   // PENDING / PARTIAL / PAID

    // Admission done flag (true = student is enrolled & trainer assigned)
    private boolean admissionDone;

    // Student (user account)
    private Long   studentId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;

    // Course
    private Long   courseId;
    private String courseName;
    private String courseLevel;
    private Integer courseDurationMonths;

    // Trainer
    private Long   trainerId;
    private String trainerName;

    // Original enquiry / lead info
    private Long   enquiryId;
    private String leadName;         // from enquiry
    private String leadPhone;        // from enquiry
    private String leadEmail;        // from enquiry
    private String enquirySource;
    private String enquiryPriority;

    // Counsellor who converted this lead
    private Long   counsellorId;
    private String counsellorName;

    public static AdmissionResponse from(Admission a) {
        BigDecimal fee     = a.getCourse().getFee()  != null ? a.getCourse().getFee()  : BigDecimal.ZERO;
        BigDecimal paid    = a.getFeePaid()           != null ? a.getFeePaid()          : BigDecimal.ZERO;
        BigDecimal balance = fee.subtract(paid).max(BigDecimal.ZERO);

        // Enquiry / counsellor info (may be null if enquiry was deleted)
        Long   enquiryId       = null;
        String leadName        = a.getStudent().getName(); // fallback to student name
        String leadPhone       = a.getStudent().getEmail();
        String leadEmail       = null;
        String enquirySource   = null;
        String enquiryPriority = null;
        Long   counsellorId    = null;
        String counsellorName  = null;

        if (a.getEnquiry() != null) {
            enquiryId       = a.getEnquiry().getId();
            leadName        = a.getEnquiry().getLeadName();
            leadPhone       = a.getEnquiry().getPhone();
            leadEmail       = a.getEnquiry().getEmail();
            enquirySource   = a.getEnquiry().getSource();
            enquiryPriority = a.getEnquiry().getPriority() != null
                    ? a.getEnquiry().getPriority().name() : null;
            if (a.getEnquiry().getCounsellor() != null) {
                counsellorId   = a.getEnquiry().getCounsellor().getId();
                counsellorName = a.getEnquiry().getCounsellor().getName();
            }
        }

        // admissionDone = trainer is assigned AND at least partial payment made
        boolean admissionDone = a.getTrainer() != null
                && a.getPaymentStatus() != Admission.PaymentStatus.PENDING;

        return AdmissionResponse.builder()
                // Admission
                .id(a.getId())
                .admissionDate(a.getAdmissionDate())
                .createdAt(a.getCreatedAt())
                // Payment
                .feePaid(paid)
                .courseFee(fee)
                .balanceDue(balance)
                .paymentStatus(a.getPaymentStatus().name())
                .admissionDone(admissionDone)
                // Student
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getName())
                .studentEmail(a.getStudent().getEmail())
                // Course
                .courseId(a.getCourse().getId())
                .courseName(a.getCourse().getName())
                .courseLevel(a.getCourse().getLevel() != null ? a.getCourse().getLevel().name() : null)
                .courseDurationMonths(a.getCourse().getDurationMonths())
                // Trainer
                .trainerId(a.getTrainer() != null ? a.getTrainer().getId()   : null)
                .trainerName(a.getTrainer() != null ? a.getTrainer().getName() : null)
                // Enquiry
                .enquiryId(enquiryId)
                .leadName(leadName)
                .leadPhone(leadPhone)
                .leadEmail(leadEmail)
                .enquirySource(enquirySource)
                .enquiryPriority(enquiryPriority)
                // Counsellor
                .counsellorId(counsellorId)
                .counsellorName(counsellorName)
                .build();
    }
}
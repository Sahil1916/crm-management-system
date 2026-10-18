package com.admitpro.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "admissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Admission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FIX: All four relations changed from LAZY to EAGER.
    // AdmissionResponse.from() accesses getEnquiry().getCounsellor().getName(),
    // getStudent().getName(), getCourse().getFee(), getTrainer().getName()
    // OUTSIDE the @Transactional service method (in the controller's .map()).
    // With open-in-view=false, LAZY proxies throw LazyInitializationException
    // there, causing 500 errors -> "Failed to load" on the frontend.

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enquiry_id")
    private Enquiry enquiry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trainer_id")
    private User trainer;

    @Column(name = "fee_paid", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal feePaid = BigDecimal.ZERO;

    @Column(name = "admission_date", nullable = false)
    private LocalDate admissionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum PaymentStatus { PENDING, PARTIAL, PAID }
}
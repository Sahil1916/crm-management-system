package com.admitpro.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "enquiries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Enquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_name", nullable = false, length = 100)
    private String leadName;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 150)
    private String email;

    // FIX: changed from LAZY to EAGER.
    // EnquiryResponse.from() calls e.getCourse().getName() OUTSIDE the
    // @Transactional service method (inside the controller's .map() call).
    // With open-in-view=false, the Hibernate session is closed by then,
    // so a LAZY proxy throws LazyInitializationException -> 500 error
    // -> frontend shows "Failed to load enquiries".
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    // FIX: same reason - counsellorName is read in EnquiryResponse.from()
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "counsellor_id")
    private User counsellor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.COLD;

    @Column(length = 50)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "enquiry_date", updatable = false)
    private LocalDateTime enquiryDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        enquiryDate = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Status   { NEW, IN_CONTACT, CONVERTED, DROPPED }
    public enum Priority { HOT, WARM, COLD }
}
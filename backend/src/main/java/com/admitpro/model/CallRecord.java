package com.admitpro.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CallRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id", nullable = false)
    private Enquiry enquiry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "counsellor_id", nullable = false)
    private User counsellor;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Outcome outcome;

    @Column(name = "called_at", updatable = false)
    private LocalDateTime calledAt;

    @PrePersist
    protected void onCreate() { calledAt = LocalDateTime.now(); }

    public enum Outcome { INTERESTED, NOT_INTERESTED, CALLBACK, NO_RESPONSE }
}
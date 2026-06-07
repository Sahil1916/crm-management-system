package com.sahilcrm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "call_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counselor_id", nullable = false)
    private User counselor;

    @Column(nullable = false)
    private LocalDateTime callDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CallStatus callStatus;

    private Integer durationMinutes;

    @Column(length = 2000)
    private String remarks;

    private LocalDateTime nextFollowUpDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum CallStatus {
        CONNECTED, NOT_REACHABLE, BUSY, WRONG_NUMBER, CALLBACK_LATER, INTERESTED, NOT_INTERESTED
    }
}


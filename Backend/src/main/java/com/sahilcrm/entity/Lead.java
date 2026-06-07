package com.sahilcrm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @Column(nullable = false)
    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Column(nullable = false)
    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[0-9]{7,15}$", message = "Phone must be 7–15 digits")
    private String phone;

    @Builder.Default
    private String countryCode = "+91";

    @Column(nullable = false)
    @NotBlank(message = "Course is required")
    private String course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Source is required")
    private Source source;

    @Size(max = 200)
    private String college;

    @Size(max = 200)
    private String university;

    @Enumerated(EnumType.STRING)
    private Qualification qualification;

    @Size(max = 100)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Stage stage = Stage.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum Source {
        META, GOOGLE, INSTAGRAM, WALKIN, INBOUND, COLLEGE
    }

    public enum Stage {
        OPEN, CNR, CALLBACK, STAGE2, STAGE2_5, ADMITTED
    }

    public enum Qualification {
        HIGH_SCHOOL, DIPLOMA, BACHELORS, MASTERS, OTHER
    }
}

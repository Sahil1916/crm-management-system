package com.admitpro.service;

import com.admitpro.dto.request.AdmissionRequest;
import com.admitpro.dto.response.AdmissionResponse;
import com.admitpro.dto.response.EnquiryResponse;
import com.admitpro.dto.response.PagedResponse;
import com.admitpro.exception.BadRequestException;
import com.admitpro.exception.ResourceNotFoundException;
import com.admitpro.model.*;
import com.admitpro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdmissionService {

    private final AdmissionRepository admissionRepository;
    private final EnquiryRepository   enquiryRepository;
    private final UserRepository      userRepository;
    private final CourseRepository    courseRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder     passwordEncoder;

    // ─────────────────────────────────────────────────────────────────────────
    // GET CONVERTED ENQUIRIES for Admission Page
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConvertedEnquiries(
            String currentUserEmail, String currentUserRole) {

        List<Enquiry> converted;
        if ("COUNSELLOR".equals(currentUserRole)) {
            User me = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            converted = enquiryRepository.findConvertedByCounsellor(me.getId());
        } else {
            converted = enquiryRepository.findAllConverted();
        }

        return converted.stream().map(e -> {
            boolean hasAdmission = admissionRepository.findByEnquiry_Id(e.getId()).isPresent();
            Object admissionData = admissionRepository.findByEnquiry_Id(e.getId())
                    .map(AdmissionResponse::from).orElse(null);

            Map<String, Object> row = new HashMap<>();
            row.put("enquiry",      EnquiryResponse.from(e));
            row.put("hasAdmission", hasAdmission);
            row.put("admission",    admissionData != null ? admissionData : Map.of());
            return row;
        }).toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE ADMISSION
    // FIX: studentId is now optional.
    //   - If studentId is provided → use that existing student account.
    //   - If studentId is NOT provided → automatically create a STUDENT user
    //     from the enquiry's lead name, phone, and email.
    //     This fixes the "Super Admin" bug where the admin's own ID was used.
    // ─────────────────────────────────────────────────────────────────────────
    public AdmissionResponse create(AdmissionRequest req) {

        // 1. Validate enquiry exists and is CONVERTED
        Enquiry enquiry = enquiryRepository.findById(req.getEnquiryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Enquiry not found: " + req.getEnquiryId()));

        if (enquiry.getStatus() != Enquiry.Status.CONVERTED) {
            throw new BadRequestException(
                    "Only CONVERTED leads can be admitted. Current status: "
                            + enquiry.getStatus());
        }

        // 2. Prevent duplicate admissions for same enquiry
        admissionRepository.findByEnquiry_Id(enquiry.getId()).ifPresent(existing -> {
            throw new BadRequestException(
                    "Admission already exists for this lead (ID: " + existing.getId() + ")");
        });

        // 3. Resolve student user
        User student;
        if (req.getStudentId() != null) {
            // Admin explicitly provided a student user ID
            student = userRepository.findById(req.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Student user not found: " + req.getStudentId()));
        } else {
            // AUTO-CREATE: create a STUDENT user from the enquiry lead data
            // This is the main fix for the "Super Admin" bug
            student = autoCreateStudentFromEnquiry(enquiry);
        }

        // 4. Course
        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found: " + req.getCourseId()));

        // 5. Optional trainer
        User trainer = null;
        if (req.getTrainerId() != null) {
            trainer = userRepository.findById(req.getTrainerId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Trainer not found: " + req.getTrainerId()));
            if (trainer.getRole() != User.Role.TRAINER)
                throw new BadRequestException("Assigned user is not a trainer");
        }

        // 6. Determine payment status
        BigDecimal feePaid = req.getFeePaid() != null ? req.getFeePaid() : BigDecimal.ZERO;
        Admission.PaymentStatus paymentStatus;
        if (feePaid.compareTo(BigDecimal.ZERO) == 0) {
            paymentStatus = Admission.PaymentStatus.PENDING;
        } else if (feePaid.compareTo(course.getFee()) >= 0) {
            paymentStatus = Admission.PaymentStatus.PAID;
        } else {
            paymentStatus = Admission.PaymentStatus.PARTIAL;
        }

        // 7. Save admission
        Admission saved = admissionRepository.save(Admission.builder()
                .enquiry(enquiry)
                .student(student)
                .course(course)
                .trainer(trainer)
                .feePaid(feePaid)
                .admissionDate(req.getAdmissionDate() != null
                        ? req.getAdmissionDate() : LocalDate.now())
                .paymentStatus(paymentStatus)
                .build());

        // 8. Notifications
        notificationService.send(student.getId(),
                "Admission Confirmed! 🎓",
                "Your admission to " + course.getName() + " is confirmed. Welcome!");

        if (trainer != null) {
            notificationService.send(trainer.getId(),
                    "New Student Assigned",
                    student.getName() + " has been admitted to "
                            + course.getName() + " and assigned to you.");
        }

        log.info("Admission created: enquiry={}, student='{}', course='{}'",
                enquiry.getId(), student.getName(), course.getName());

        return AdmissionResponse.from(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTO-CREATE STUDENT from enquiry lead data
    // ─────────────────────────────────────────────────────────────────────────
    private User autoCreateStudentFromEnquiry(Enquiry enquiry) {
        // Build email: use enquiry email if available, otherwise generate from phone
        String email = (enquiry.getEmail() != null && !enquiry.getEmail().isBlank())
                ? enquiry.getEmail().trim().toLowerCase()
                : enquiry.getPhone().trim() + "@student.admitpro.com";

        // Check if a student user already exists with this email
        return userRepository.findByEmail(email).orElseGet(() -> {
            // Create new STUDENT user
            String defaultPassword = passwordEncoder.encode("Student@123");

            User newStudent = User.builder()
                    .name(enquiry.getLeadName())
                    .email(email)
                    .password(defaultPassword)
                    .role(User.Role.STUDENT)
                    .phone(enquiry.getPhone())
                    .isActive(true)
                    .build();

            User saved = userRepository.save(newStudent);
            log.info("Auto-created student user: id={}, name='{}', email='{}'",
                    saved.getId(), saved.getName(), saved.getEmail());
            return saved;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE PAYMENT
    // ─────────────────────────────────────────────────────────────────────────
    public AdmissionResponse updatePayment(Long admissionId, BigDecimal newFeePaid) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Admission not found: " + admissionId));

        if (newFeePaid.compareTo(BigDecimal.ZERO) < 0)
            throw new BadRequestException("Fee paid cannot be negative");

        BigDecimal courseFee = admission.getCourse().getFee();
        admission.setFeePaid(newFeePaid);

        if (newFeePaid.compareTo(BigDecimal.ZERO) == 0) {
            admission.setPaymentStatus(Admission.PaymentStatus.PENDING);
        } else if (newFeePaid.compareTo(courseFee) >= 0) {
            admission.setPaymentStatus(Admission.PaymentStatus.PAID);
        } else {
            admission.setPaymentStatus(Admission.PaymentStatus.PARTIAL);
        }

        return AdmissionResponse.from(admissionRepository.save(admission));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSIGN TRAINER
    // ─────────────────────────────────────────────────────────────────────────
    public AdmissionResponse assignTrainer(Long admissionId, Long trainerId) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Admission not found: " + admissionId));
        User trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trainer not found: " + trainerId));

        if (trainer.getRole() != User.Role.TRAINER)
            throw new BadRequestException("User is not a trainer");

        admission.setTrainer(trainer);
        Admission saved = admissionRepository.save(admission);

        notificationService.send(trainerId,
                "Student Assigned",
                saved.getStudent().getName() + " assigned to you for "
                        + saved.getCourse().getName());

        return AdmissionResponse.from(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIND FOR LOGGED-IN USER (role-aware)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Object findForUser(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return switch (user.getRole()) {
            case ADMIN -> PagedResponse.of(
                    admissionRepository.findAllByOrderByCreatedAtDesc(
                            PageRequest.of(page, size)).map(AdmissionResponse::from));
            case COUNSELLOR -> admissionRepository.findByCounsellorId(user.getId())
                    .stream().map(AdmissionResponse::from).toList();
            case TRAINER -> admissionRepository.findByTrainer_Id(user.getId())
                    .stream().map(AdmissionResponse::from).toList();
            case STUDENT -> admissionRepository.findByStudent_Id(user.getId())
                    .stream().map(AdmissionResponse::from).toList();
        };
    }
}
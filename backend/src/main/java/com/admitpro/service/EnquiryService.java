package com.admitpro.service;

import com.admitpro.exception.BadRequestException;
import com.admitpro.exception.ResourceNotFoundException;
import com.admitpro.model.*;
import com.admitpro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EnquiryService {

    private final EnquiryRepository   enquiryRepository;
    private final CourseRepository    courseRepository;
    private final UserRepository      userRepository;
    private final NotificationService notificationService;

    // ── Create ────────────────────────────────────────────────────────────────
    // FIX: When a COUNSELLOR creates an enquiry, auto-assign it to themselves.
    // Admin can assign to any counsellor via the counsellorId field.
    public Enquiry create(String leadName, String phone, String email,
                          Long courseId, Long counsellorId,
                          String source, String remarks, Enquiry.Priority priority,
                          String currentUserEmail, String currentUserRole) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        User counsellor = null;

        if ("COUNSELLOR".equals(currentUserRole)) {
            // Counsellor creating enquiry → always assigned to themselves
            counsellor = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Counsellor not found"));
        } else if (counsellorId != null) {
            // Admin creating enquiry → can optionally assign to a counsellor
            counsellor = userRepository.findById(counsellorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Counsellor not found: " + counsellorId));
            if (counsellor.getRole() != User.Role.COUNSELLOR)
                throw new BadRequestException("Assigned user is not a counsellor");
        }

        Enquiry enquiry = enquiryRepository.save(Enquiry.builder()
                .leadName(leadName).phone(phone).email(email)
                .course(course).counsellor(counsellor)
                .source(source).remarks(remarks)
                .priority(priority != null ? priority : Enquiry.Priority.COLD)
                .status(Enquiry.Status.NEW)
                .build());

        if (counsellor != null) {
            notificationService.send(counsellor.getId(),
                    "New Lead Assigned",
                    "Enquiry from " + leadName + " has been assigned to you.");
        }

        log.info("Enquiry created by {} (role={}) for lead '{}'",
                currentUserEmail, currentUserRole, leadName);

        return enquiry;
    }

    // ── Find All — role-aware ─────────────────────────────────────────────────
    // Counsellors automatically see only their own leads.
    @Transactional(readOnly = true)
    public Page<Enquiry> findAll(Enquiry.Status status, Enquiry.Priority priority,
                                 Long counsellorId, String search,
                                 int page, int size, String sort,
                                 String currentUserEmail, String currentUserRole) {

        Pageable pageable = PageRequest.of(
                page, size,
                Sort.by(Sort.Direction.DESC, sort != null ? sort : "enquiryDate")
        );

        Long effectiveCounsellorId = counsellorId;

        // If COUNSELLOR is logged in, force filter to their own leads only
        if ("COUNSELLOR".equals(currentUserRole)) {
            User me = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            effectiveCounsellorId = me.getId();
        }

        return enquiryRepository.findWithFilters(
                status, priority, effectiveCounsellorId, search, pageable
        );
    }

    // ── Find By ID ────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Enquiry findById(Long id) {
        return enquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enquiry not found: " + id));
    }

    // ── Update Status — counsellors can only update their own leads ───────────
    public Enquiry updateStatus(Long id, Enquiry.Status status,
                                String currentUserEmail, String currentUserRole) {
        Enquiry enquiry = findById(id);

        // Ownership check for counsellors
        if ("COUNSELLOR".equals(currentUserRole)) {
            User me = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (enquiry.getCounsellor() == null
                    || !enquiry.getCounsellor().getId().equals(me.getId())) {
                throw new BadRequestException("You can only update your own leads");
            }
        }

        enquiry.setStatus(status);
        return enquiryRepository.save(enquiry);
    }

    // ── Assign Counsellor (Admin only) ────────────────────────────────────────
    @PreAuthorize("hasRole('ADMIN')")
    public Enquiry assignCounsellor(Long enquiryId, Long counsellorId) {
        Enquiry enquiry = findById(enquiryId);
        User counsellor = userRepository.findById(counsellorId)
                .orElseThrow(() -> new ResourceNotFoundException("Counsellor not found"));
        if (counsellor.getRole() != User.Role.COUNSELLOR)
            throw new BadRequestException("User is not a counsellor");

        enquiry.setCounsellor(counsellor);
        enquiry = enquiryRepository.save(enquiry);

        notificationService.send(counsellorId, "Lead Assigned",
                "Enquiry from " + enquiry.getLeadName() + " assigned to you.");
        return enquiry;
    }

    // ── Admin dashboard stats ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Map<String, Long> getDashboardStats() {
        return Map.of(
                "total",     enquiryRepository.count(),
                "new",       enquiryRepository.countByStatus(Enquiry.Status.NEW),
                "inContact", enquiryRepository.countByStatus(Enquiry.Status.IN_CONTACT),
                "converted", enquiryRepository.countByStatus(Enquiry.Status.CONVERTED),
                "dropped",   enquiryRepository.countByStatus(Enquiry.Status.DROPPED)
        );
    }

    // ── Counsellor stats (only their leads) ───────────────────────────────────
    @Transactional(readOnly = true)
    public Map<String, Long> getCounsellorStats(String email) {
        User me = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long cId = me.getId();

        long total     = enquiryRepository.countByCounsellorId(cId);
        long newCount  = enquiryRepository.countByCounsellorIdAndStatus(cId, Enquiry.Status.NEW);
        long inContact = enquiryRepository.countByCounsellorIdAndStatus(cId, Enquiry.Status.IN_CONTACT);
        long converted = enquiryRepository.countByCounsellorIdAndStatus(cId, Enquiry.Status.CONVERTED);
        long dropped   = enquiryRepository.countByCounsellorIdAndStatus(cId, Enquiry.Status.DROPPED);

        return Map.of(
                "total",     total,
                "new",       newCount,
                "inContact", inContact,
                "converted", converted,
                "dropped",   dropped
        );
    }
}
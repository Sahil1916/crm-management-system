package com.admitpro.repository;

import com.admitpro.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    // ── ADMIN: all admissions paged ────────────────────────────────────────
    Page<Admission> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ── TRAINER: their assigned students ──────────────────────────────────
    List<Admission> findByTrainer_IdOrderByCreatedAtDesc(Long trainerId);

    // ── STUDENT: their own admission ───────────────────────────────────────
    List<Admission> findByStudent_IdOrderByCreatedAtDesc(Long studentId);

    // ── COUNSELLOR: admissions from their converted leads ─────────────────
    @Query("""
        SELECT a FROM Admission a
        WHERE a.enquiry.counsellor.id = :counsellorId
        ORDER BY a.createdAt DESC
        """)
    List<Admission> findByCounsellorId(@Param("counsellorId") Long counsellorId);

    // ── Check if a CONVERTED enquiry already has an admission record ───────
    Optional<Admission> findByEnquiry_Id(Long enquiryId);

    // ── Report: count by date range ─────────────────────────────────────────
    long countByAdmissionDateBetween(LocalDate from, LocalDate to);

    // ── Backward compat (kept for other usages) ────────────────────────────
    default List<Admission> findByTrainer_Id(Long id) { return findByTrainer_IdOrderByCreatedAtDesc(id); }
    default List<Admission> findByStudent_Id(Long id) { return findByStudent_IdOrderByCreatedAtDesc(id); }
}
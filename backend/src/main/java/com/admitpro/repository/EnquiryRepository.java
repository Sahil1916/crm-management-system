package com.admitpro.repository;

import com.admitpro.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {

    // ── Main filtered search (Admin + Counsellor) ──────────────────────────
    @Query("""
        SELECT e FROM Enquiry e
        WHERE (:status IS NULL OR e.status = :status)
          AND (:priority IS NULL OR e.priority = :priority)
          AND (:counsellorId IS NULL OR e.counsellor.id = :counsellorId)
          AND (
               :search IS NULL
               OR LOWER(e.leadName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR e.phone          LIKE CONCAT('%', :search, '%')
               OR LOWER(e.email)   LIKE LOWER(CONCAT('%', :search, '%'))
          )
        ORDER BY e.enquiryDate DESC
        """)
    Page<Enquiry> findWithFilters(
            @Param("status")       Enquiry.Status   status,
            @Param("priority")     Enquiry.Priority priority,
            @Param("counsellorId") Long             counsellorId,
            @Param("search")       String           search,
            Pageable pageable
    );

    // ── All CONVERTED enquiries (for Admission page) ───────────────────────
    // Returns enquiries with status=CONVERTED so admin can create admissions
    @Query("""
        SELECT e FROM Enquiry e
        WHERE e.status = 'CONVERTED'
        ORDER BY e.updatedAt DESC
        """)
    List<Enquiry> findAllConverted();

    // ── CONVERTED enquiries for a specific counsellor ──────────────────────
    @Query("""
        SELECT e FROM Enquiry e
        WHERE e.status = 'CONVERTED'
          AND e.counsellor.id = :counsellorId
        ORDER BY e.updatedAt DESC
        """)
    List<Enquiry> findConvertedByCounsellor(@Param("counsellorId") Long counsellorId);

    // ── Admin dashboard stats ──────────────────────────────────────────────
    long countByStatus(Enquiry.Status status);

    // ── Counsellor stats ───────────────────────────────────────────────────
    @Query("SELECT COUNT(e) FROM Enquiry e WHERE e.counsellor.id = :cId")
    long countByCounsellorId(@Param("cId") Long cId);

    @Query("SELECT COUNT(e) FROM Enquiry e WHERE e.counsellor.id = :cId AND e.status = :status")
    long countByCounsellorIdAndStatus(
            @Param("cId")    Long           cId,
            @Param("status") Enquiry.Status status
    );

    // ── Report service ─────────────────────────────────────────────────────
    @Query("SELECT COUNT(e) FROM Enquiry e WHERE e.counsellor.id = :cId AND e.status = :status")
    long countByCounsellorAndStatus(
            @Param("cId")    Long           cId,
            @Param("status") Enquiry.Status status
    );
}
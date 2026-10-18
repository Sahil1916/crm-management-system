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
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findByEnquiry_IdOrderByFollowUpDateDesc(Long enquiryId);
    List<FollowUp> findByCounsellor_IdAndIsDoneAndFollowUpDateLessThanEqual(
        Long counsellorId, boolean isDone, LocalDate date);
}


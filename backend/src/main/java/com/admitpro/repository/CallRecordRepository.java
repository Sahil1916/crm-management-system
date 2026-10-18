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
public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {
    List<CallRecord> findByEnquiry_IdOrderByCalledAtDesc(Long enquiryId);
}


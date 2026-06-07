package com.sahilcrm.repository;

import com.sahilcrm.entity.CallRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {
    List<CallRecord> findByLeadId(Long leadId);
    List<CallRecord> findByCounselorId(Long counselorId);
}


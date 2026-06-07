package com.sahilcrm.repository;

import com.sahilcrm.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findByCounselorId(Long counselorId);
    List<FollowUp> findByLeadId(Long leadId);
    List<FollowUp> findByStatus(FollowUp.Status status);
}


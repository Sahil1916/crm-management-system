package com.sahilcrm.repository;

import com.sahilcrm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedToId(Long counselorId);
    List<Lead> findByAssignedToEmail(String email);
    List<Lead> findByStage(Lead.Stage stage);
    List<Lead> findBySource(Lead.Source source);
    long countByStage(Lead.Stage stage);
}

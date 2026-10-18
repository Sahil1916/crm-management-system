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
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByTrainer_IdAndAttendanceDate(Long trainerId, LocalDate date);
    List<Attendance> findByStudent_Id(Long studentId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :sId AND a.status = 'PRESENT'")
    long countPresentByStudent(@Param("sId") Long studentId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :sId")
    long countTotalByStudent(@Param("sId") Long studentId);
}


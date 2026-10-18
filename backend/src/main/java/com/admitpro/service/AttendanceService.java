package com.admitpro.service;

import com.admitpro.dto.request.*;
import com.admitpro.dto.response.*;
import com.admitpro.exception.BadRequestException;
import com.admitpro.exception.ResourceNotFoundException;
import com.admitpro.model.*;
import com.admitpro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository       userRepository;

    @Transactional(readOnly = true)
    public List<Attendance> get(Long trainerId, String dateStr) {
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
        return attendanceRepository.findByTrainer_IdAndAttendanceDate(trainerId, date);
    }

    public void markBulk(AttendanceBulkRequest req, String trainerEmail) {
        User trainer = userRepository.findByEmail(trainerEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Trainer not found"));
        req.getEntries().forEach(entry -> {
            User student = userRepository.findById(entry.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
            attendanceRepository.findByTrainer_IdAndAttendanceDate(trainer.getId(), req.getDate())
                .stream().filter(a -> a.getStudent().getId().equals(entry.getStudentId()))
                .findFirst().ifPresentOrElse(
                    a -> { a.setStatus(entry.getStatus()); attendanceRepository.save(a); },
                    () -> attendanceRepository.save(Attendance.builder()
                        .student(student).trainer(trainer)
                        .attendanceDate(req.getDate()).status(entry.getStatus()).build())
                );
        });
    }

    public Map<String, Object> getSummary(Long studentId) {
        long present = attendanceRepository.countPresentByStudent(studentId);
        long total   = attendanceRepository.countTotalByStudent(studentId);
        double pct   = total > 0 ? Math.round((present * 100.0 / total) * 10.0) / 10.0 : 0;
        return Map.of("present", present, "total", total, "percentage", pct);
    }
}


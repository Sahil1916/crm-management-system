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

// â”€â”€â”€ CourseService â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<Course> findAll() { return courseRepository.findByIsActive(true); }

    @Transactional(readOnly = true)
    public Course findById(Long id) {
        return courseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
    }

    public Course create(CourseRequest req) {
        if (courseRepository.existsByCode(req.getCode()))
            throw new BadRequestException("Course code exists: " + req.getCode());
        return courseRepository.save(Course.builder()
            .name(req.getName()).code(req.getCode()).level(req.getLevel())
            .durationMonths(req.getDurationMonths()).fee(req.getFee())
            .description(req.getDescription()).isActive(true).build());
    }

    public Course update(Long id, CourseRequest req) {
        Course c = findById(id);
        c.setName(req.getName()); c.setLevel(req.getLevel());
        c.setDurationMonths(req.getDurationMonths()); c.setFee(req.getFee());
        c.setDescription(req.getDescription());
        return courseRepository.save(c);
    }

    public void delete(Long id) {
        Course c = findById(id); c.setActive(false); courseRepository.save(c);
    }
}


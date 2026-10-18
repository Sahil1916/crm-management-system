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

// â”€â”€â”€ ReportService â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportService {

    private final AdmissionRepository admissionRepository;
    private final EnquiryRepository   enquiryRepository;
    private final UserRepository      userRepository;

    public Object admissionsReport(String from, String to, String format) {
        LocalDate f = from != null ? LocalDate.parse(from) : LocalDate.now().minusMonths(1);
        LocalDate t = to   != null ? LocalDate.parse(to)   : LocalDate.now();
        return Map.of("from", f.toString(), "to", t.toString(),
            "totalAdmissions", admissionRepository.countByAdmissionDateBetween(f, t));
    }

    public List<Map<String, Object>> counsellorPerformance() {
        return userRepository.findByRole(User.Role.COUNSELLOR).stream().map(c -> {
            long conv = enquiryRepository.countByCounsellorAndStatus(c.getId(), Enquiry.Status.CONVERTED);
            long drop = enquiryRepository.countByCounsellorAndStatus(c.getId(), Enquiry.Status.DROPPED);
            long inc  = enquiryRepository.countByCounsellorAndStatus(c.getId(), Enquiry.Status.IN_CONTACT);
            long nw   = enquiryRepository.countByCounsellorAndStatus(c.getId(), Enquiry.Status.NEW);
            long total = conv + drop + inc + nw;
            double rate = total > 0 ? Math.round((conv * 100.0 / total) * 10.0) / 10.0 : 0;
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId()); m.put("name", c.getName());
            m.put("assigned", total); m.put("converted", conv);
            m.put("dropped", drop);  m.put("conversionRate", rate);
            return m;
        }).toList();
    }

    public Map<String, Object> leadConversion() {
        long total = enquiryRepository.count();
        long conv  = enquiryRepository.countByStatus(Enquiry.Status.CONVERTED);
        long drop  = enquiryRepository.countByStatus(Enquiry.Status.DROPPED);
        double rate = total > 0 ? Math.round((conv * 100.0 / total) * 10.0) / 10.0 : 0;
        return Map.of("total", total, "converted", conv, "dropped", drop, "conversionRate", rate);
    }
}


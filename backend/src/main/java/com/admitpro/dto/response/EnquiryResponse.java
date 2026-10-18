package com.admitpro.dto.response;

import com.admitpro.model.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class EnquiryResponse {
    private Long id;
    private String leadName;
    private String phone;
    private String email;
    private String courseName;
    private Long courseId;
    private String counsellorName;
    private Long counsellorId;
    private String status;
    private String priority;
    private String source;
    private String remarks;
    private LocalDateTime enquiryDate;

    public static EnquiryResponse from(Enquiry e) {
        return EnquiryResponse.builder()
            .id(e.getId()).leadName(e.getLeadName())
            .phone(e.getPhone()).email(e.getEmail())
            .courseId(e.getCourse().getId()).courseName(e.getCourse().getName())
            .counsellorId(e.getCounsellor() != null ? e.getCounsellor().getId() : null)
            .counsellorName(e.getCounsellor() != null ? e.getCounsellor().getName() : null)
            .status(e.getStatus().name()).priority(e.getPriority().name())
            .source(e.getSource()).remarks(e.getRemarks())
            .enquiryDate(e.getEnquiryDate()).build();
    }
}


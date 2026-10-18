package com.admitpro.dto.response;

import com.admitpro.model.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class FollowUpResponse {
    private Long id;
    private String remarks;
    private LocalDate followUpDate;
    private boolean isDone;
    private LocalDateTime createdAt;

    public static FollowUpResponse from(FollowUp f) {
        return FollowUpResponse.builder()
            .id(f.getId()).remarks(f.getRemarks())
            .followUpDate(f.getFollowUpDate())
            .isDone(f.isDone()).createdAt(f.getCreatedAt()).build();
    }
}


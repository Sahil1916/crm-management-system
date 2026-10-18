package com.admitpro.dto.response;

import com.admitpro.model.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class CallRecordResponse {
    private Long id;
    private String notes;
    private String outcome;
    private LocalDateTime calledAt;
    private String counsellorName;

    public static CallRecordResponse from(CallRecord c) {
        return CallRecordResponse.builder()
            .id(c.getId()).notes(c.getNotes())
            .outcome(c.getOutcome().name())
            .calledAt(c.getCalledAt())
            .counsellorName(c.getCounsellor() != null ? c.getCounsellor().getName() : null)
            .build();
    }
}


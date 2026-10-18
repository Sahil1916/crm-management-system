package com.admitpro.dto.response;

import com.admitpro.model.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class CourseResponse {
    private Long id;
    private String name;
    private String code;
    private String level;
    private Integer durationMonths;
    private BigDecimal fee;
    private String description;
    private boolean isActive;

    public static CourseResponse from(Course c) {
        return CourseResponse.builder()
            .id(c.getId()).name(c.getName()).code(c.getCode())
            .level(c.getLevel().name()).durationMonths(c.getDurationMonths())
            .fee(c.getFee()).description(c.getDescription()).isActive(c.isActive()).build();
    }
}


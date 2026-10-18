package com.admitpro.dto.request;

import com.admitpro.model.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CourseRequest {
    @NotBlank public String name;
    @NotBlank public String code;
    @NotNull public Course.Level level;
    @NotNull @Min(1) public Integer durationMonths;
    @NotNull @DecimalMin("0.01") public BigDecimal fee;
    public String description;
}


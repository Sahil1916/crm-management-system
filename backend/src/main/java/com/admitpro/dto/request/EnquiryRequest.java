package com.admitpro.dto.request;

import com.admitpro.model.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class EnquiryRequest {
    @NotBlank public String leadName;
    @NotBlank public String phone;
    @Email public String email;
    @NotNull public Long courseId;
    public Long counsellorId;
    public String source;
    public String remarks;
    public Enquiry.Priority priority;
}


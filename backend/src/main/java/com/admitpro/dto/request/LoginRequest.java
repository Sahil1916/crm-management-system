package com.admitpro.dto.request;

import com.admitpro.model.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class LoginRequest {
    @NotBlank @Email
    public String email;
    @NotBlank @Size(min = 6)
    public String password;
}


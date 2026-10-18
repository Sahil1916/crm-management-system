package com.admitpro.dto.request;

import com.admitpro.model.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateUserRequest {
    @NotBlank public String name;
    @NotBlank @Email public String email;
    @NotBlank @Size(min = 6) public String password;
    @NotNull public User.Role role;
    public String phone;
}


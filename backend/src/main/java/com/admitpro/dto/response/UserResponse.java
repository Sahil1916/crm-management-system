package com.admitpro.dto.response;

import com.admitpro.model.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private boolean isActive;
    private LocalDateTime createdAt;

    public static UserResponse from(User u) {
        return UserResponse.builder()
            .id(u.getId()).name(u.getName()).email(u.getEmail())
            .role(u.getRole().name()).phone(u.getPhone())
            .isActive(u.isActive()).createdAt(u.getCreatedAt()).build();
    }
}


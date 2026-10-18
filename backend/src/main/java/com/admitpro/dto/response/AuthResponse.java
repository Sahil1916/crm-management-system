package com.admitpro.dto.response;

import com.admitpro.model.*;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class AuthResponse {
    private String token;
    private String type;
    private Long id;
    private String name;
    private String email;
    private String role;

    public static AuthResponse of(User user, String token) {
        return AuthResponse.builder()
            .token(token).type("Bearer")
            .id(user.getId()).name(user.getName())
            .email(user.getEmail()).role(user.getRole().name())
            .build();
    }
}


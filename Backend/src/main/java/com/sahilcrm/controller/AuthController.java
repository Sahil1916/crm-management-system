package com.sahilcrm.controller;

import com.sahilcrm.dto.AuthResponse;
import com.sahilcrm.dto.LoginRequest;
import com.sahilcrm.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // Stateless JWT: client drops the token. Server-side revocation can be added via blacklist.
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}

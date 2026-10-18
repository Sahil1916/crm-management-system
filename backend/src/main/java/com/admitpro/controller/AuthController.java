package com.admitpro.controller;

import com.admitpro.dto.request.LoginRequest;
import com.admitpro.dto.response.ApiResponse;
import com.admitpro.dto.response.AuthResponse;
import com.admitpro.dto.response.UserResponse;
import com.admitpro.model.User;
import com.admitpro.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// ─── AuthController ───────────────────────────────────────────────────────────
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req.getEmail(), req.getPassword()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails ud) {
        User user = authService.getCurrentUser(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success(UserResponse.from(user)));
    }
}

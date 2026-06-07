package com.sahilcrm.service;

import com.sahilcrm.dto.AuthResponse;
import com.sahilcrm.dto.LoginRequest;
import com.sahilcrm.entity.User;
import com.sahilcrm.repository.UserRepository;
import com.sahilcrm.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (DisabledException e) {
            log.warn("Login attempt for disabled account: {}", request.getEmail());
            return AuthResponse.builder()
                    .success(false)
                    .message("Account is disabled. Contact your administrator.")
                    .build();
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for email: {}", request.getEmail());
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid email or password")
                    .build();
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        log.info("Successful login for user: {} role: {}", user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .role(user.getRole().name())
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .build())
                .build();
    }
}

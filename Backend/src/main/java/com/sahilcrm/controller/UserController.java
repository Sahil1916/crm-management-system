package com.sahilcrm.controller;

import com.sahilcrm.entity.User;
import com.sahilcrm.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .role(request.getRole() != null ? request.getRole() : User.Role.COUNSELOR)
                .password(passwordEncoder.encode(request.getPassword()))
                .active(true)
                .build();
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                           @Valid @RequestBody UpdateUserRequest request) {
        return userRepository.findById(id).map(existing -> {
            existing.setName(request.getName());
            existing.setEmail(request.getEmail());
            if (request.getRole() != null) existing.setRole(request.getRole());
            if (request.getActive() != null) existing.setActive(request.getActive());
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                existing.setPassword(passwordEncoder.encode(request.getPassword()));
            }
            return ResponseEntity.ok(userRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class CreateUserRequest {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Email
        private String email;

        @NotBlank @Size(min = 2, max = 100)
        private String name;

        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        private User.Role role;
    }

    @Data
    public static class UpdateUserRequest {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Email
        private String email;

        @NotBlank @Size(min = 2, max = 100)
        private String name;

        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        private User.Role role;
        private Boolean active;
    }
}

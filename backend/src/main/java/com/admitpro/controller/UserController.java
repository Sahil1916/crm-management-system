package com.admitpro.controller;

import com.admitpro.dto.request.*;
import com.admitpro.dto.response.*;
import com.admitpro.model.*;
import com.admitpro.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

// ─── UserController ───────────────────────────────────────────────────────────
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAll(@RequestParam(required = false) User.Role role) {
        List<User> users = role != null ? userService.findByRole(role) : userService.findAll();
        return ResponseEntity.ok(ApiResponse.success(
                users.stream().map(UserResponse::from).toList()
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(UserResponse.from(userService.findById(id))));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CreateUserRequest req) {
        User user = userService.create(req.getName(), req.getEmail(),
                req.getPassword(), req.getRole(), req.getPhone());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created", UserResponse.from(user)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @Valid @RequestBody UpdateUserRequest req) {
        User user = userService.update(id, req.getName(), req.getPhone(), req.isActive());
        return ResponseEntity.ok(ApiResponse.success("User updated", UserResponse.from(user)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated", null));
    }
}


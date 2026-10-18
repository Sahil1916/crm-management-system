package com.admitpro.service;

import com.admitpro.dto.request.*;
import com.admitpro.dto.response.*;
import com.admitpro.exception.BadRequestException;
import com.admitpro.exception.ResourceNotFoundException;
import com.admitpro.model.*;
import com.admitpro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

// â”€â”€â”€ UserService â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PreAuthorize("hasRole('ADMIN')")
    public User create(String name, String email, String password, User.Role role, String phone) {
        if (userRepository.existsByEmail(email))
            throw new BadRequestException("Email already in use: " + email);
        return userRepository.save(User.builder()
            .name(name).email(email)
            .password(passwordEncoder.encode(password))
            .role(role).phone(phone).isActive(true).build());
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> findAll() { return userRepository.findAll(); }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> findByRole(User.Role role) { return userRepository.findByRole(role); }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public User update(Long id, String name, String phone, boolean isActive) {
        User user = findById(id);
        user.setName(name); user.setPhone(phone); user.setActive(isActive);
        return userRepository.save(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void delete(Long id) {
        User user = findById(id);
        user.setActive(false);
        userRepository.save(user);
    }
}


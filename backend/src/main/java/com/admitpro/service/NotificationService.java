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

// â”€â”€â”€ NotificationService â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Async
    public void send(Long userId, String title, String message) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;
            Notification n = Notification.builder()
                .user(user).title(title).message(message).build();
            notificationRepository.save(n);
        } catch (Exception e) {
            log.error("Notification failed: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findByUser_IdAndIsReadOrderByCreatedAtDesc(userId, false);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.findByUser_IdAndIsReadOrderByCreatedAtDesc(userId, false)
            .forEach(n -> { n.setRead(true); notificationRepository.save(n); });
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByUser_IdAndIsRead(userId, false);
    }
}


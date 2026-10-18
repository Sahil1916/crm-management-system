package com.admitpro.controller;

import com.admitpro.dto.response.ApiResponse;
import com.admitpro.model.User;
import com.admitpro.service.AuthService;
import com.admitpro.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// ─── NotificationController ───────────────────────────────────────────────────
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final AuthService         authService;

    @GetMapping("/unread")
    public ResponseEntity<?> getUnread(@AuthenticationPrincipal UserDetails ud) {
        User user = authService.getCurrentUser(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnread(user.getId())));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> countUnread(@AuthenticationPrincipal UserDetails ud) {
        User user = authService.getCurrentUser(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.success(notificationService.countUnread(user.getId())));
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        User user = authService.getCurrentUser(ud.getUsername());
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked read", null));
    }
}

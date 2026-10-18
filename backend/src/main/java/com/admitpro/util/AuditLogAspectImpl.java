package com.admitpro.util;

import com.admitpro.model.AuditLog;
import com.admitpro.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspectImpl {

    private final AuditLogRepository auditLogRepository;

    @Around("@annotation(com.admitpro.util.Auditable)")
    public Object audit(ProceedingJoinPoint joinPoint) throws Throwable {
        Object result = joinPoint.proceed();
        try {
            MethodSignature sig = (MethodSignature) joinPoint.getSignature();
            Auditable ann = sig.getMethod().getAnnotation(Auditable.class);
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                saveLog(auth.getName(), ann.action(), ann.entityType());
            }
        } catch (Exception e) {
            log.warn("Audit log failed: {}", e.getMessage());
        }
        return result;
    }

    @Async
    public void saveLog(String email, String action, String entityType) {
        try {
            auditLogRepository.save(AuditLog.builder()
                .userEmail(email).action(action).entityType(entityType)
                .description(action + " on " + entityType).build());
        } catch (Exception e) {
            log.warn("Audit save failed: {}", e.getMessage());
        }
    }
}

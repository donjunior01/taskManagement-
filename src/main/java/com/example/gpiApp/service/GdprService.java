package com.example.gpiApp.service;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * GDPR helpers: a data subject's right of access (export) and right to erasure (anonymise). Both are
 * tenant-scoped through the repositories (which are @Filter'd), so an admin can only act within their org.
 */
@Service
@RequiredArgsConstructor
public class GdprService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final TimeLogRepository timeLogRepository;
    private final MessageRepository messageRepository;
    private final DeliverableRepository deliverableRepository;
    private final PasswordEncoder passwordEncoder;

    /** Machine-readable dump of everything personal we hold about the user. */
    @Transactional(readOnly = true)
    public Map<String, Object> export(Long userId) {
        allUsers u = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("exportedAt", LocalDateTime.now().toString());

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", u.getId());
        profile.put("username", u.getUsername());
        profile.put("email", u.getEmail());
        profile.put("firstName", u.getFirstName());
        profile.put("lastName", u.getLastName());
        profile.put("role", u.getRole() != null ? u.getRole().name() : null);
        profile.put("active", u.isActive());
        out.put("profile", profile);

        var all = org.springframework.data.domain.Pageable.unpaged();
        out.put("tasksAssigned", map(taskRepository.findByAssignedToId(userId, all).getContent(), t -> entry(
                "id", t.getId(), "name", t.getName(), "status", str(t.getStatus()),
                "priority", str(t.getPriority()), "deadline", str(t.getDeadline()))));
        out.put("tasksCreated", map(taskRepository.findByCreatedById(userId, all).getContent(), t -> entry(
                "id", t.getId(), "name", t.getName(), "status", str(t.getStatus()))));
        out.put("comments", map(commentRepository.findByUserId(userId, all).getContent(), c -> entry(
                "id", c.getId(), "content", c.getContent())));
        out.put("timeLogs", map(timeLogRepository.findByUserId(userId, all).getContent(), l -> entry(
                "id", l.getId(), "hours", l.getHoursSpent())));
        out.put("messagesSent", map(messageRepository.findBySenderId(userId, all).getContent(), m -> entry(
                "id", m.getId(), "content", m.getContent())));
        out.put("deliverablesSubmitted", map(deliverableRepository.findBySubmittedById(userId, all).getContent(), d -> entry(
                "id", d.getId(), "fileName", d.getFileName(), "status", str(d.getStatus()))));
        return out;
    }

    /**
     * Right to erasure: strip all PII from the account and deactivate it, keeping the row so the work
     * it's linked to (tasks, comments) stays referentially intact but is no longer personally identifiable.
     */
    @Transactional
    public void anonymize(Long userId) {
        allUsers u = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("User not found"));
        u.setFirstName("Deleted");
        u.setLastName("User");
        u.setUsername("deleted_" + u.getId());
        u.setEmail("deleted+" + u.getId() + "@example.invalid");
        u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        u.setPasswordChangedAt(LocalDateTime.now());
        u.setActive(false);
        u.setTwoFactorEnabled(false);
        u.setTwoFactorSecret(null);
        userRepository.save(u);
    }

    // ── helpers ──
    private static <T> List<Map<String, Object>> map(List<T> items, Function<T, Map<String, Object>> f) {
        return items == null ? List.of() : items.stream().map(f).toList();
    }
    private static String str(Object o) { return o == null ? null : o.toString(); }
    private static Map<String, Object> entry(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) m.put(String.valueOf(kv[i]), kv[i + 1]);
        return m;
    }
}

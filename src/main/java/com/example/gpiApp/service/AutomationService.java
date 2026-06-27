package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.AutomationRule;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.repository.AutomationRuleRepository;
import com.example.gpiApp.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Runs tenant-scoped automation rules. Domain services call {@link #fire(String, Map)} when something
 * happens (e.g. a task is created); matching enabled rules then execute their action. Firing is
 * best-effort — it never throws into the business operation that triggered it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AutomationService {

    public static final List<String> TRIGGERS = List.of("task.created", "task.status_changed", "task.completed", "task.assigned");
    public static final List<String> ACTIONS = List.of("set_priority", "set_status", "assign", "notify");
    public static final List<String> CONDITION_FIELDS = List.of("priority", "status", "projectId");

    private final AutomationRuleRepository ruleRepository;
    private final TaskRepository taskRepository;
    private final com.example.gpiApp.repository.UserRepository userRepository;
    private final NotificationService notificationService;

    // ── Engine ──
    @Transactional
    public void fire(String trigger, Map<String, Object> context) {
        try {
            Long org = TenantContext.getOrganizationId();
            if (org == null) return;
            List<AutomationRule> rules = ruleRepository.findByOrganizationIdAndTriggerAndEnabledTrue(org, trigger);
            for (AutomationRule rule : rules) {
                try {
                    if (matches(rule, context)) runAction(rule, context);
                } catch (Exception e) {
                    log.warn("Automation rule {} failed: {}", rule.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Automation fire({}) failed: {}", trigger, e.getMessage());
        }
    }

    private boolean matches(AutomationRule rule, Map<String, Object> ctx) {
        if (rule.getConditionField() == null || rule.getConditionField().isBlank()) return true;
        Object v = ctx.get(rule.getConditionField());
        return v != null && String.valueOf(v).equalsIgnoreCase(rule.getConditionValue());
    }

    private void runAction(AutomationRule rule, Map<String, Object> ctx) {
        Object taskIdObj = ctx.get("taskId");
        Long taskId = taskIdObj == null ? null : Long.valueOf(String.valueOf(taskIdObj));
        switch (rule.getActionType()) {
            case "set_priority": {
                if (taskId == null) return;
                taskRepository.findById(taskId).ifPresent(t -> {
                    t.setPriority(Task.TaskPriority.valueOf(rule.getActionValue()));
                    taskRepository.save(t);
                });
                break;
            }
            case "set_status": {
                if (taskId == null) return;
                taskRepository.findById(taskId).ifPresent(t -> {
                    t.setStatus(Task.TaskStatus.valueOf(rule.getActionValue()));
                    taskRepository.save(t);
                });
                break;
            }
            case "assign": {
                if (taskId == null) return;
                Long assigneeId = Long.valueOf(rule.getActionValue());
                taskRepository.findById(taskId).ifPresent(t ->
                        userRepository.findById(assigneeId).ifPresent(u -> { t.setAssignedTo(u); taskRepository.save(t); }));
                break;
            }
            case "notify": {
                Long userId = Long.valueOf(rule.getActionValue());
                notificationService.createNotification(userId, "Automation: " + rule.getName(),
                        "An automation rule was triggered" + (ctx.get("name") != null ? " for: " + ctx.get("name") : "") + ".",
                        Notification.NotificationType.SYSTEM, taskId, "TASK");
                break;
            }
            default:
                return;
        }
        rule.setRunCount(rule.getRunCount() + 1);
        rule.setLastRunAt(LocalDateTime.now());
        ruleRepository.save(rule);
    }

    // ── CRUD (admin/PM with automation.manage) ──
    @Transactional(readOnly = true)
    public List<AutomationRule> listForCurrentTenant() {
        Long org = TenantContext.getOrganizationId();
        return org != null ? ruleRepository.findByOrganizationIdOrderByCreatedAtDesc(org) : ruleRepository.findAll();
    }

    @Transactional
    public AutomationRule create(AutomationRule r) {
        r.setId(null);
        validate(r);
        return ruleRepository.save(r); // TenantListener stamps the org
    }

    @Transactional
    public AutomationRule update(Long id, AutomationRule patch) {
        AutomationRule r = getOwned(id);
        if (patch.getName() != null) r.setName(patch.getName());
        if (patch.getTrigger() != null) r.setTrigger(patch.getTrigger());
        r.setConditionField(patch.getConditionField());
        r.setConditionValue(patch.getConditionValue());
        if (patch.getActionType() != null) r.setActionType(patch.getActionType());
        r.setActionValue(patch.getActionValue());
        r.setEnabled(patch.isEnabled());
        validate(r);
        return ruleRepository.save(r);
    }

    @Transactional
    public void delete(Long id) { ruleRepository.delete(getOwned(id)); }

    @Transactional
    public AutomationRule toggle(Long id) {
        AutomationRule r = getOwned(id);
        r.setEnabled(!r.isEnabled());
        return ruleRepository.save(r);
    }

    private void validate(AutomationRule r) {
        if (r.getName() == null || r.getName().isBlank()) throw new IllegalArgumentException("Rule name is required.");
        if (!TRIGGERS.contains(r.getTrigger())) throw new IllegalArgumentException("Unknown trigger.");
        if (!ACTIONS.contains(r.getActionType())) throw new IllegalArgumentException("Unknown action.");
    }

    private AutomationRule getOwned(Long id) {
        AutomationRule r = ruleRepository.findById(id).orElseThrow(() -> new AccessDeniedException("Rule not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && r.getOrganizationId() != null && !org.equals(r.getOrganizationId())) {
            throw new AccessDeniedException("This rule belongs to another organization.");
        }
        return r;
    }
}

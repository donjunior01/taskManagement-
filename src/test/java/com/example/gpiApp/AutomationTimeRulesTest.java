package com.example.gpiApp;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.AutomationRule;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.AutomationRuleRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.AutomationService;
import com.example.gpiApp.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomationTimeRulesTest {

    @Mock AutomationRuleRepository ruleRepository;
    @Mock TaskRepository taskRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;
    @InjectMocks AutomationService automationService;

    @AfterEach
    void resetTenant() { TenantContext.clear(); }

    @Test
    void firesDeadlineApproachingRuleAndNotifiesAssignee() {
        when(ruleRepository.findOrgIdsWithEnabledTrigger("task.deadline_approaching")).thenReturn(List.of(1L));
        when(ruleRepository.findOrgIdsWithEnabledTrigger("task.overdue")).thenReturn(List.of());

        allUsers assignee = new allUsers();
        assignee.setId(5L);
        Task task = new Task();
        task.setId(10L); task.setName("Ship release"); task.setAssignedTo(assignee);

        when(taskRepository.findByOrganizationIdAndDeadlineBetweenAndStatusNot(
                eq(1L), any(), any(), eq(Task.TaskStatus.COMPLETED))).thenReturn(List.of(task));

        AutomationRule rule = AutomationRule.builder()
                .id(1L).organizationId(1L).name("Deadline nudge")
                .trigger("task.deadline_approaching").actionType("notify_assignee").enabled(true).build();
        when(ruleRepository.findByOrganizationIdAndTriggerAndEnabledTrue(1L, "task.deadline_approaching"))
                .thenReturn(List.of(rule));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        int fired = automationService.runTimeBasedRules();

        assertEquals(1, fired);
        // The task's own assignee (id 5) is notified.
        verify(notificationService).createNotification(eq(5L), anyString(), anyString(),
                any(Notification.NotificationType.class), eq(10L), eq("TASK"));
        // Rule bookkeeping persisted (runCount++, lastRunAt).
        verify(ruleRepository).save(rule);
        // Tenant context is restored after the pass — no leak onto the scheduler thread.
        assertNull(TenantContext.getOrganizationId());
    }

    @Test
    void skipsWhenNoOrgHasATimeBasedRule() {
        when(ruleRepository.findOrgIdsWithEnabledTrigger(anyString())).thenReturn(List.of());

        int fired = automationService.runTimeBasedRules();

        assertEquals(0, fired);
        verifyNoInteractions(taskRepository, notificationService);
    }
}

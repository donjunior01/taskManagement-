package com.example.gpiApp;

import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.AutomationService;
import com.example.gpiApp.service.TaskService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Unit tests for the atomic bulk task action. Only the collaborators bulkUpdate touches are mocked. */
@ExtendWith(MockitoExtension.class)
class TaskBulkUpdateTest {

    @Mock TaskRepository taskRepository;
    @Mock UserRepository userRepository;
    @Mock AutomationService automationService;
    @InjectMocks TaskService taskService;

    @Test
    void bulkPriorityAppliesToEverySelectedTask() {
        Task t1 = new Task(); t1.setId(1L); t1.setName("a");
        Task t2 = new Task(); t2.setId(2L); t2.setName("b");
        when(taskRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(t1, t2));

        ApiResponse<Map<String, Object>> res = taskService.bulkUpdate(List.of(1L, 2L), "priority", "HIGH", false);

        verify(taskRepository, times(2)).save(any(Task.class));
        assertEquals(2, res.getData().get("affected"));
        assertEquals(Task.TaskPriority.HIGH, t1.getPriority());
        assertEquals(Task.TaskPriority.HIGH, t2.getPriority());
    }

    @Test
    void bulkStatusCompletedForcesFullProgressAndFiresAutomation() {
        Task t = new Task(); t.setId(1L); t.setName("ship"); t.setStatus(Task.TaskStatus.TODO); t.setProgress(10);
        when(taskRepository.findAllById(List.of(1L))).thenReturn(List.of(t));

        taskService.bulkUpdate(List.of(1L), "status", "COMPLETED", false);

        assertEquals(Task.TaskStatus.COMPLETED, t.getStatus());
        assertEquals(100, t.getProgress());
        verify(automationService).fire(eq("task.status_changed"), any());
        verify(automationService).fire(eq("task.completed"), any());
    }

    @Test
    void bulkDeleteWithoutPermissionIsDenied() {
        Task t = new Task(); t.setId(1L);
        when(taskRepository.findAllById(List.of(1L))).thenReturn(List.of(t));

        assertThrows(AccessDeniedException.class,
                () -> taskService.bulkUpdate(List.of(1L), "delete", null, false));
        verify(taskRepository, never()).delete(any(Task.class));
    }

    @Test
    void emptySelectionIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> taskService.bulkUpdate(List.of(), "priority", "HIGH", false));
        verifyNoInteractions(taskRepository);
    }
}

package com.example.gpiApp.controller;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskController {
    
    private final TaskService taskService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable UUID id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> createTask(@RequestBody TaskDTO taskDTO) {
        return ResponseEntity.ok(taskService.createTask(taskDTO));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable UUID id, @RequestBody TaskDTO taskDTO) {
        return ResponseEntity.ok(taskService.updateTask(id, taskDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/creator/{userId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getTasksByCreator(@PathVariable UUID userId) {
        return ResponseEntity.ok(taskService.getTasksByCreator(userId));
    }
    
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getTasksByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getTasksByStatus(@PathVariable Task.TaskStatus status) {
        return ResponseEntity.ok(taskService.getTasksByStatus(status));
    }
    
    @GetMapping("/type/{taskType}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getTasksByType(@PathVariable Task.TaskType taskType) {
        return ResponseEntity.ok(taskService.getTasksByType(taskType));
    }
    
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getOverdueTasks() {
        return ResponseEntity.ok(taskService.getOverdueTasks());
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> searchTasks(@RequestParam String keyword) {
        return ResponseEntity.ok(taskService.searchTasksByKeyword(keyword));
    }
    
    @PutMapping("/{id}/status/{status}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> updateTaskStatus(@PathVariable UUID id, @PathVariable Task.TaskStatus status) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }
    
    @PutMapping("/{id}/progress")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> updateTaskProgress(@PathVariable UUID id, @RequestParam Double progressPercentage) {
        return ResponseEntity.ok(taskService.updateTaskProgress(id, progressPercentage));
    }
    
    @PutMapping("/{id}/assign/{assigneeId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> assignTask(@PathVariable UUID id, @PathVariable UUID assigneeId) {
        return ResponseEntity.ok(taskService.assignTask(id, assigneeId));
    }
    
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> completeTask(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.completeTask(id));
    }
    
    @GetMapping("/calendar")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getCalendarTasks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(taskService.getTasksByUserAndDateRange(
            UUID.randomUUID(), start, end)); // TODO: Get current user ID
    }
    
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskDTO>> getRecentTasks() {
        return ResponseEntity.ok(taskService.getTasksByCreator(UUID.randomUUID())); // TODO: Get current user ID
    }
    
    @PutMapping("/{id}/dates")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> updateTaskDates(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDate) {
        TaskDTO taskDTO = new TaskDTO();
        taskDTO.setStartDate(startDate);
        taskDTO.setDueDate(dueDate);
        return ResponseEntity.ok(taskService.updateTask(id, taskDTO));
    }
} 
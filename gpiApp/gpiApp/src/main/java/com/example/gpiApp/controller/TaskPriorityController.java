package com.example.gpiApp.controller;

import com.example.gpiApp.dto.TaskPriorityDTO;
import com.example.gpiApp.service.TaskPriorityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/task-priorities")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskPriorityController {
    
    private final TaskPriorityService taskPriorityService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskPriorityDTO>> getAllTaskPriorities() {
        return ResponseEntity.ok(taskPriorityService.getAllTaskPriorities());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskPriorityDTO> getTaskPriorityById(@PathVariable UUID id) {
        return taskPriorityService.getTaskPriorityById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskPriorityDTO> createTaskPriority(@RequestBody TaskPriorityDTO taskPriorityDTO) {
        return ResponseEntity.ok(taskPriorityService.createTaskPriority(taskPriorityDTO));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskPriorityDTO> updateTaskPriority(@PathVariable UUID id, @RequestBody TaskPriorityDTO taskPriorityDTO) {
        return ResponseEntity.ok(taskPriorityService.updateTaskPriority(id, taskPriorityDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTaskPriority(@PathVariable UUID id) {
        taskPriorityService.deleteTaskPriority(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskPriorityDTO>> getActiveTaskPriorities() {
        return ResponseEntity.ok(taskPriorityService.getActiveTaskPriorities());
    }
} 
package com.example.gpiApp.controller;

import com.example.gpiApp.dto.TaskCategoryDTO;
import com.example.gpiApp.service.TaskCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/task-categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskCategoryController {
    
    private final TaskCategoryService taskCategoryService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskCategoryDTO>> getAllTaskCategories() {
        return ResponseEntity.ok(taskCategoryService.getAllTaskCategories());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskCategoryDTO> getTaskCategoryById(@PathVariable Long id) {
        return taskCategoryService.getTaskCategoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskCategoryDTO> createTaskCategory(@RequestBody TaskCategoryDTO taskCategoryDTO) {
        return ResponseEntity.ok(taskCategoryService.createTaskCategory(taskCategoryDTO));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TaskCategoryDTO> updateTaskCategory(@PathVariable Long id, @RequestBody TaskCategoryDTO taskCategoryDTO) {
        return ResponseEntity.ok(taskCategoryService.updateTaskCategory(id, taskCategoryDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTaskCategory(@PathVariable Long id) {
        taskCategoryService.deleteTaskCategory(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TaskCategoryDTO>> getActiveTaskCategories() {
        return ResponseEntity.ok(taskCategoryService.getActiveTaskCategories());
    }
} 
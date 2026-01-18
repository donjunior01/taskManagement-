package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management operations")
public class ProjectController {
    
    private final ProjectService projectService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Get all projects", description = "Retrieve paginated list of all projects")
    @GetMapping
    public ResponseEntity<PagedResponse<ProjectDTO>> getAllProjects(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(projectService.getAllProjects(page, size, sortBy, sortDir));
    }
    
    @Operation(summary = "Get project by ID", description = "Retrieve a specific project by its ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDTO>> getProjectById(
            @Parameter(description = "Project ID") @PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }
    
    @Operation(summary = "Create project", description = "Create a new project")
    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDTO>> createProject(
            @RequestBody ProjectRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(projectService.createProject(request, userId));
    }
    
    @Operation(summary = "Update project", description = "Update an existing project")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDTO>> updateProject(
            @Parameter(description = "Project ID") @PathVariable Long id,
            @RequestBody ProjectRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(projectService.updateProject(id, request, userId));
    }
    
    @Operation(summary = "Delete project", description = "Delete a project")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @Parameter(description = "Project ID") @PathVariable Long id,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(projectService.deleteProject(id, userId));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<PagedResponse<ProjectDTO>> getProjectsByStatus(
            @PathVariable Project.ProjectStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(projectService.getProjectsByStatus(status, page, size));
    }
    
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<PagedResponse<ProjectDTO>> getProjectsByManager(
            @PathVariable Long managerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(projectService.getProjectsByManager(managerId, page, size));
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null) {
            return userRepository.findByEmail(authentication.getName())
                    .map(allUsers::getId)
                    .orElse(null);
        }
        return null;
    }
}


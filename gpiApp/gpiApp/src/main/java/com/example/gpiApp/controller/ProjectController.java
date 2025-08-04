package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProjectController {
    
    private final ProjectService projectService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable UUID id) {
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ProjectDTO> createProject(@RequestBody ProjectDTO projectDTO) {
        return ResponseEntity.ok(projectService.createProject(projectDTO));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable UUID id, @RequestBody ProjectDTO projectDTO) {
        return ResponseEntity.ok(projectService.updateProject(id, projectDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/team/{teamId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getProjectsByTeam(@PathVariable UUID teamId) {
        return ResponseEntity.ok(projectService.getProjectsByTeam(teamId));
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getProjectsByStatus(@PathVariable Project.ProjectStatus status) {
        return ResponseEntity.ok(projectService.getProjectsByStatus(status));
    }
    
    @GetMapping("/team/{teamId}/status/{status}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getProjectsByTeamAndStatus(@PathVariable UUID teamId, @PathVariable Project.ProjectStatus status) {
        return ResponseEntity.ok(projectService.getProjectsByTeamAndStatus(teamId, status));
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getActiveProjectsOnDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(projectService.getActiveProjectsOnDate(date));
    }
    
    @GetMapping("/leader/{leaderId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getProjectsByTeamLeader(@PathVariable UUID leaderId) {
        return ResponseEntity.ok(projectService.getProjectsByTeamLeader(leaderId));
    }
    
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectDTO>> getOverdueProjects() {
        return ResponseEntity.ok(projectService.getOverdueProjects());
    }
    
    @PutMapping("/{id}/status/{status}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ProjectDTO> updateProjectStatus(@PathVariable UUID id, @PathVariable Project.ProjectStatus status) {
        return ResponseEntity.ok(projectService.updateProjectStatus(id, status));
    }
    
    @PutMapping("/{projectId}/team/{teamId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ProjectDTO> assignProjectToTeam(@PathVariable UUID projectId, @PathVariable UUID teamId) {
        return ResponseEntity.ok(projectService.assignProjectToTeam(projectId, teamId));
    }
    
    @GetMapping("/count/status/{status}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Long> getProjectCountByStatus(@PathVariable Project.ProjectStatus status) {
        return ResponseEntity.ok(projectService.countProjectsByStatus(status));
    }
} 
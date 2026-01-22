package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.TeamRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final ActivityLogService activityLogService;
    private final CalendarService calendarService;
    
    public ProjectService(ProjectRepository projectRepository, 
                          UserRepository userRepository,
                          TaskRepository taskRepository,
                          TeamRepository teamRepository,
                          ActivityLogService activityLogService,
                          @Lazy CalendarService calendarService) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.teamRepository = teamRepository;
        this.activityLogService = activityLogService;
        this.calendarService = calendarService;
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<ProjectDTO> getAllProjects(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, size, sort);
        Page<Project> projectPage = projectRepository.findAll(pageable);
        
        List<ProjectDTO> projectDTOs = projectPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(projectDTOs, projectPage.getNumber(), projectPage.getSize(),
                projectPage.getTotalElements(), projectPage.getTotalPages(),
                projectPage.isFirst(), projectPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<ProjectDTO> getProjectById(Long id) {
        return projectRepository.findById(id)
                .map(project -> ApiResponse.success("Project retrieved successfully", convertToDTO(project)))
                .orElse(ApiResponse.error("Project not found"));
    }
    
    @Transactional
    public ApiResponse<ProjectDTO> createProject(ProjectRequestDTO request, Long createdById) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus() != null ? request.getStatus() : Project.ProjectStatus.ACTIVE);
        project.setProgress(0);
        
        if (request.getManagerId() != null) {
            userRepository.findById(request.getManagerId())
                    .ifPresent(project::setManager);
        }
        
        Project savedProject = projectRepository.save(project);
        
        // Log activity
        userRepository.findById(createdById).ifPresent(user -> 
            activityLogService.logActivity(
                com.example.gpiApp.entity.ActivityLog.ActivityType.PROJECT_CREATED,
                "Project '" + savedProject.getName() + "' was created",
                user,
                "PROJECT",
                savedProject.getId(),
                null
            )
        );
        
        // Create calendar events for project start and end dates
        try {
            calendarService.createProjectCalendarEvents(savedProject, createdById);
        } catch (Exception e) {
            // Log but don't fail the project creation
            System.err.println("Failed to create calendar events: " + e.getMessage());
        }
        
        return ApiResponse.success("Project created successfully", convertToDTO(savedProject));
    }
    
    @Transactional
    public ApiResponse<ProjectDTO> updateProject(Long id, ProjectRequestDTO request, Long updatedById) {
        return projectRepository.findById(id)
                .map(project -> {
                    project.setName(request.getName());
                    project.setDescription(request.getDescription());
                    project.setStartDate(request.getStartDate());
                    project.setEndDate(request.getEndDate());
                    if (request.getStatus() != null) {
                        project.setStatus(request.getStatus());
                    }
                    
                    if (request.getManagerId() != null) {
                        userRepository.findById(request.getManagerId())
                                .ifPresent(project::setManager);
                    }
                    
                    Project updatedProject = projectRepository.save(project);
                    
                    // Log activity
                    userRepository.findById(updatedById).ifPresent(user -> 
                        activityLogService.logActivity(
                            com.example.gpiApp.entity.ActivityLog.ActivityType.PROJECT_UPDATED,
                            "Project '" + updatedProject.getName() + "' was updated",
                            user,
                            "PROJECT",
                            updatedProject.getId(),
                            null
                        )
                    );
                    
                    // Update calendar events for project
                    try {
                        calendarService.updateProjectCalendarEvents(updatedProject);
                    } catch (Exception e) {
                        System.err.println("Failed to update calendar events: " + e.getMessage());
                    }
                    
                    return ApiResponse.success("Project updated successfully", convertToDTO(updatedProject));
                })
                .orElse(ApiResponse.error("Project not found"));
    }
    
    @Transactional
    public ApiResponse<Void> deleteProject(Long id, Long deletedById) {
        return projectRepository.findById(id)
                .map(project -> {
                    String projectName = project.getName();
                    projectRepository.delete(project);
                    
                    // Log activity
                    userRepository.findById(deletedById).ifPresent(user -> 
                        activityLogService.logActivity(
                            com.example.gpiApp.entity.ActivityLog.ActivityType.PROJECT_DELETED,
                            "Project '" + projectName + "' was deleted",
                            user,
                            "PROJECT",
                            id,
                            null
                        )
                    );
                    
                    return ApiResponse.<Void>success("Project deleted successfully", null);
                })
                .orElse(ApiResponse.error("Project not found"));
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<ProjectDTO> getProjectsByStatus(Project.ProjectStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Project> projectPage = projectRepository.findByStatus(status, pageable);
        
        List<ProjectDTO> projectDTOs = projectPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(projectDTOs, projectPage.getNumber(), projectPage.getSize(),
                projectPage.getTotalElements(), projectPage.getTotalPages(),
                projectPage.isFirst(), projectPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<ProjectDTO> getProjectsByManager(Long managerId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Project> projectPage = projectRepository.findByManagerId(managerId, pageable);
        
        List<ProjectDTO> projectDTOs = projectPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(projectDTOs, projectPage.getNumber(), projectPage.getSize(),
                projectPage.getTotalElements(), projectPage.getTotalPages(),
                projectPage.isFirst(), projectPage.isLast());
    }
    
    private ProjectDTO convertToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .managerId(project.getManager() != null ? project.getManager().getId() : null)
                .managerName(project.getManager() != null ? 
                        project.getManager().getFirstName() + " " + project.getManager().getLastName() : null)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .progress(project.getProgress())
                .taskCount(project.getTasks() != null ? project.getTasks().size() : 0)
                .teamCount(project.getTeams() != null ? project.getTeams().size() : 0)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}


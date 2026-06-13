package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.TeamRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
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
                          CalendarService calendarService) {
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
        Page<Project> projectPage = projectRepository.findAllActive(pageable);

        List<ProjectDTO> projectDTOs = projectPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return PagedResponse.of(projectDTOs, projectPage.getNumber(), projectPage.getSize(),
                projectPage.getTotalElements(), projectPage.getTotalPages(),
                projectPage.isFirst(), projectPage.isLast());
    }

    /** Archive or unarchive a project (admin action). Archived projects drop out of the default lists. */
    @Transactional
    public ApiResponse<ProjectDTO> setArchived(Long id, boolean archived) {
        return projectRepository.findById(id)
                .map(project -> {
                    project.setArchived(archived);
                    Project saved = projectRepository.save(project);
                    return ApiResponse.success(archived ? "Project archived" : "Project unarchived", convertToDTO(saved));
                })
                .orElse(ApiResponse.error("Project not found"));
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

        // Record the creator (drives per-admin project counts & traceability).
        if (createdById != null) {
            userRepository.findById(createdById).ifPresent(project::setCreatedBy);
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
            log.warn("Failed to create calendar events for project {}: {}", savedProject.getId(), e.getMessage());
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
                    
                    if (request.getProgress() != null) {
                        project.setProgress(request.getProgress());
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
                        log.warn("Failed to update calendar events for project {}: {}", updatedProject.getId(), e.getMessage());
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
    
    @Transactional(readOnly = true)
    public ApiResponse<List<UserDTO>> getProjectMembers(Long projectId) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    List<allUsers> members = project.getTeams().stream()
                            .flatMap(team -> team.getMembers().stream())
                            .distinct()
                            .collect(Collectors.toList());
                    
                    List<UserDTO> memberDTOs = members.stream()
                            .map(this::convertUserToDTO)
                            .collect(Collectors.toList());
                    return ApiResponse.success("Project members retrieved successfully", memberDTOs);
                })
                .orElse(ApiResponse.error("Project not found"));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<ProjectDTO>> getActiveProjectsForUser(Long userId) {
        allUsers user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ApiResponse.error("User not found");
        }
        
        List<Project> projects;
        if (user.getRole() == allUsers.Role.ADMIN) {
            projects = projectRepository.findAll().stream()
                    .filter(p -> p.getStatus() != Project.ProjectStatus.COMPLETED && p.getStatus() != Project.ProjectStatus.CANCELLED)
                    .collect(Collectors.toList());
        } else {
            projects = projectRepository.findActiveProjectsByUserIdAndStatusNotIn(
                    userId, 
                    List.of(Project.ProjectStatus.COMPLETED, Project.ProjectStatus.CANCELLED)
            );
        }
        
        List<ProjectDTO> projectDTOs = projects.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ApiResponse.success("Active assigned projects retrieved successfully", projectDTOs);
    }

    private UserDTO convertUserToDTO(allUsers user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole());
        dto.setFullName(user.getFirstName() + " " + user.getLastName());
        return dto;
    }

    private ProjectDTO convertToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .managerId(project.getManager() != null ? project.getManager().getId() : null)
                .managerName(project.getManager() != null ?
                        project.getManager().getFirstName() + " " + project.getManager().getLastName() : null)
                .createdById(project.getCreatedBy() != null ? project.getCreatedBy().getId() : null)
                .createdByName(project.getCreatedBy() != null ?
                        project.getCreatedBy().getFirstName() + " " + project.getCreatedBy().getLastName() : null)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .progress(project.getProgress())
                .archived(project.getArchived())
                .taskCount(project.getTasks() != null ? project.getTasks().size() : 0)
                .teamCount((int) (project.getTeams() != null ? 
                        project.getTeams().stream()
                                .flatMap(t -> t.getMembers().stream())
                                .distinct()
                                .count() : 0))
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}


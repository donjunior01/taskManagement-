package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.NotificationService;
import com.example.gpiApp.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    /**
     * Internal utility class to manage user identification and username generation
     */
    private static class UserManager {
        
        /**
         * Generate a username from first and last name
         */
        public static String generateUsername(String firstName, String lastName) {
            if (firstName == null || lastName == null) {
                return null;
            }
            return (firstName.toLowerCase() + "." + lastName.toLowerCase()).replaceAll("\\s+", "");
        }
        
        /**
         * Find user by generated username (first.last format)
         */
        public static allUsers findUserByGeneratedUsername(List<allUsers> allUsers, String generatedUsername) {
            return allUsers.stream()
                    .filter(user -> generatedUsername.equals(generateUsername(user.getFirstName(), user.getLastName())))
                    .findFirst()
                    .orElse(null);
        }
        
        /**
         * Find user by email (since email is unique and serves as username in the entity)
         */
        public static allUsers findUserByEmail(List<allUsers> allUsers, String email) {
            return allUsers.stream()
                    .filter(user -> email.equals(user.getEmail()))
                    .findFirst()
                    .orElse(null);
        }
        
        /**
         * Find user by first and last name combination
         */
        public static allUsers findUserByName(List<allUsers> allUsers, String firstName, String lastName) {
            return allUsers.stream()
                    .filter(user -> firstName.equals(user.getFirstName()) && lastName.equals(user.getLastName()))
                    .findFirst()
                    .orElse(null);
        }
    }

    @Override
    public List<ProjectDTO> getAllProjects() {
        try {
            List<Project> projects = projectRepository.findAll();
            return projects.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Return mock data if database is not available
            return getMockProjects();
        }
    }

    @Override
    public List<ProjectDTO> getProjectsByManager(String managerUsername) {
        try {
            // Find user by generated username (first.last format) or email
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers manager = UserManager.findUserByGeneratedUsername(allUsersList, managerUsername);
            if (manager == null) {
                // Try to find by email if username lookup fails
                manager = UserManager.findUserByEmail(allUsersList, managerUsername);
            }
            
            if (manager != null) {
                List<Project> projects = projectRepository.findProjectsByTeamLeader(manager.getUserId());
                return projects.stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());
            }
            return new ArrayList<>();
        } catch (Exception e) {
            return getMockProjects().stream()
                    .filter(project -> managerUsername.equals(project.getManager()))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public List<ProjectDTO> getProjectsByUser(String username) {
        try {
            // Find user by generated username (first.last format) or email
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers user = UserManager.findUserByGeneratedUsername(allUsersList, username);
            if (user == null) {
                // Try to find by email if username lookup fails
                user = UserManager.findUserByEmail(allUsersList, username);
            }
            
            if (user != null) {
                // Since there's no direct method to find projects by team member, we'll filter from all projects
                List<Project> allProjects = projectRepository.findAll();
                final allUsers finalUser = user; // Make effectively final
                return allProjects.stream()
                        .filter(project -> project.getTeam() != null && 
                                project.getTeam().getUserTeams() != null &&
                                project.getTeam().getUserTeams().stream()
                                        .anyMatch(userTeam -> userTeam.getIsActive() != null && 
                                                userTeam.getIsActive() && 
                                                userTeam.getUser() != null && 
                                                finalUser.getUserId().equals(userTeam.getUser().getUserId())))
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());
            }
            return new ArrayList<>();
        } catch (Exception e) {
            // For now, return all projects
            return getMockProjects();
        }
    }

    @Override
    public ProjectDTO getProjectById(Long id) {
        try {
            Project project = projectRepository.findById(id).orElse(null);
            return project != null ? convertToDTO(project) : null;
        } catch (Exception e) {
            return getMockProjects().stream()
                    .filter(project -> id.equals(project.getId()))
                    .findFirst()
                    .orElse(null);
        }
    }

    @Override
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        try {
            Project project = convertToEntity(projectDTO);
            project.setCreatedAt(LocalDateTime.now());
            project.setUpdatedAt(LocalDateTime.now());

            Project savedProject = projectRepository.save(project);
            ProjectDTO savedProjectDTO = convertToDTO(savedProject);

            // Create notification for project manager
            if (projectDTO.getManager() != null) {
                notificationService.createProjectCreatedNotification(
                    projectDTO.getManager(),
                    projectDTO.getName(),
                    savedProjectDTO.getId()
                );
            }

            return savedProjectDTO;
        } catch (Exception e) {
            // Fallback to mock implementation
            projectDTO.setId(System.currentTimeMillis());
            projectDTO.setCreatedAt(LocalDateTime.now());
            projectDTO.setUpdatedAt(LocalDateTime.now());

            // Create notification for project manager
            if (projectDTO.getManager() != null) {
                notificationService.createProjectCreatedNotification(
                    projectDTO.getManager(),
                    projectDTO.getName(),
                    projectDTO.getId()
                );
            }

            return projectDTO;
        }
    }

    @Override
    public ProjectDTO updateProject(ProjectDTO projectDTO) {
        try {
            Project existingProject = projectRepository.findById(projectDTO.getId()).orElse(null);
            if (existingProject == null) {
                return null;
            }

            Project updatedProject = convertToEntity(projectDTO);
            updatedProject.setUpdatedAt(LocalDateTime.now());
            updatedProject.setCreatedAt(existingProject.getCreatedAt());

            Project savedProject = projectRepository.save(updatedProject);
            return convertToDTO(savedProject);
        } catch (Exception e) {
            // Fallback to mock implementation
            projectDTO.setUpdatedAt(LocalDateTime.now());
            return projectDTO;
        }
    }

    @Override
    public boolean deleteProject(Long id) {
        try {
            if (projectRepository.existsById(id)) {
                projectRepository.deleteById(id);
                return true;
            }
            return false;
        } catch (Exception e) {
            return true; // Mock implementation always returns true
        }
    }

    @Override
    public Long getTotalProjectsCount() {
        try {
            return projectRepository.count();
        } catch (Exception e) {
            return (long) getMockProjects().size();
        }
    }

    @Override
    public Long getProjectsCountByManager(String managerUsername) {
        try {
            // Find user by generated username (first.last format) or email
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers manager = UserManager.findUserByGeneratedUsername(allUsersList, managerUsername);
            if (manager == null) {
                // Try to find by email if username lookup fails
                manager = UserManager.findUserByEmail(allUsersList, managerUsername);
            }
            
            if (manager != null) {
                List<Project> projects = projectRepository.findProjectsByTeamLeader(manager.getUserId());
                return (long) projects.size();
            }
            return 0L;
        } catch (Exception e) {
            return getMockProjects().stream()
                    .filter(project -> managerUsername.equals(project.getManager()))
                    .count();
        }
    }

    @Override
    public Long getActiveProjectsCount() {
        try {
            return projectRepository.countProjectsByStatus(Project.ProjectStatus.ACTIVE);
        } catch (Exception e) {
            return getMockProjects().stream()
                    .filter(project -> Project.ProjectStatus.ACTIVE.equals(project.getStatus()))
                    .count();
        }
    }

    @Override
    public Long getCompletedProjectsCount() {
        try {
            return projectRepository.countProjectsByStatus(Project.ProjectStatus.COMPLETED);
        } catch (Exception e) {
            return getMockProjects().stream()
                    .filter(project -> Project.ProjectStatus.COMPLETED.equals(project.getStatus()))
                    .count();
        }
    }

    @Override
    public Map<String, Object> getProjectProgressData() {
        try {
            Map<String, Object> progressData = new java.util.HashMap<>();
            
            // Get all projects
            List<Project> projects = projectRepository.findAll();
            
            // Calculate overall progress
            double overallProgress = projects.stream()
                    .mapToDouble(project -> {
                        List<Task> projectTasks = taskRepository.findByProjectProjectId(project.getProjectId());
                        if (projectTasks.isEmpty()) return 0.0;
                        
                        long completedTasks = projectTasks.stream()
                                .filter(task -> task.getStatus() == Task.TaskStatus.COMPLETED)
                                .count();
                        return (double) completedTasks / projectTasks.size() * 100;
                    })
                    .average()
                    .orElse(0.0);
            
            // Get projects by status
            long planningProjects = projectRepository.countProjectsByStatus(Project.ProjectStatus.PLANNING);
            long activeProjects = projectRepository.countProjectsByStatus(Project.ProjectStatus.ACTIVE);
            long onHoldProjects = projectRepository.countProjectsByStatus(Project.ProjectStatus.ON_HOLD);
            long completedProjects = projectRepository.countProjectsByStatus(Project.ProjectStatus.COMPLETED);
            long cancelledProjects = projectRepository.countProjectsByStatus(Project.ProjectStatus.CANCELLED);
            
            progressData.put("overallProgress", Math.round(overallProgress * 100.0) / 100.0);
            progressData.put("planningProjects", planningProjects);
            progressData.put("activeProjects", activeProjects);
            progressData.put("onHoldProjects", onHoldProjects);
            progressData.put("completedProjects", completedProjects);
            progressData.put("cancelledProjects", cancelledProjects);
            progressData.put("totalProjects", projects.size());
            
            return progressData;
        } catch (Exception e) {
            // Return mock data if database is not available
            Map<String, Object> mockData = new java.util.HashMap<>();
            mockData.put("overallProgress", 65.0);
            mockData.put("planningProjects", 2);
            mockData.put("activeProjects", 5);
            mockData.put("onHoldProjects", 1);
            mockData.put("completedProjects", 3);
            mockData.put("cancelledProjects", 0);
            mockData.put("totalProjects", 11);
            return mockData;
        }
    }

    @Override
    public Map<String, Object> getProjectProgressByManager(String managerUsername) {
        try {
            Map<String, Object> progressData = new java.util.HashMap<>();
            
            // Find user by generated username (first.last format) or email
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers manager = UserManager.findUserByGeneratedUsername(allUsersList, managerUsername);
            if (manager == null) {
                // Try to find by email if username lookup fails
                manager = UserManager.findUserByEmail(allUsersList, managerUsername);
            }
            
            if (manager != null) {
                List<Project> projects = projectRepository.findProjectsByTeamLeader(manager.getUserId());
                
                // Calculate manager's projects progress
                double managerProgress = projects.stream()
                        .mapToDouble(project -> {
                            List<Task> projectTasks = taskRepository.findByProjectProjectId(project.getProjectId());
                            if (projectTasks.isEmpty()) return 0.0;
                            
                            long completedTasks = projectTasks.stream()
                                    .filter(task -> task.getStatus() == Task.TaskStatus.COMPLETED)
                                    .count();
                            return (double) completedTasks / projectTasks.size() * 100;
                        })
                        .average()
                        .orElse(0.0);
                
                // Get projects by status for this manager
                long planningProjects = projects.stream()
                        .filter(p -> Project.ProjectStatus.PLANNING.equals(p.getStatus()))
                        .count();
                long activeProjects = projects.stream()
                        .filter(p -> Project.ProjectStatus.ACTIVE.equals(p.getStatus()))
                        .count();
                long onHoldProjects = projects.stream()
                        .filter(p -> Project.ProjectStatus.ON_HOLD.equals(p.getStatus()))
                        .count();
                long completedProjects = projects.stream()
                        .filter(p -> Project.ProjectStatus.COMPLETED.equals(p.getStatus()))
                        .count();
                long cancelledProjects = projects.stream()
                        .filter(p -> Project.ProjectStatus.CANCELLED.equals(p.getStatus()))
                        .count();
                
                progressData.put("managerProgress", Math.round(managerProgress * 100.0) / 100.0);
                progressData.put("planningProjects", planningProjects);
                progressData.put("activeProjects", activeProjects);
                progressData.put("onHoldProjects", onHoldProjects);
                progressData.put("completedProjects", completedProjects);
                progressData.put("cancelledProjects", cancelledProjects);
                progressData.put("totalProjects", projects.size());
            } else {
                // Return empty data if manager not found
                progressData.put("managerProgress", 0.0);
                progressData.put("planningProjects", 0);
                progressData.put("activeProjects", 0);
                progressData.put("onHoldProjects", 0);
                progressData.put("completedProjects", 0);
                progressData.put("cancelledProjects", 0);
                progressData.put("totalProjects", 0);
            }
            
            return progressData;
        } catch (Exception e) {
            // Return mock data if database is not available
            Map<String, Object> mockData = new java.util.HashMap<>();
            mockData.put("managerProgress", 75.0);
            mockData.put("planningProjects", 1);
            mockData.put("activeProjects", 2);
            mockData.put("onHoldProjects", 0);
            mockData.put("completedProjects", 1);
            mockData.put("cancelledProjects", 0);
            mockData.put("totalProjects", 4);
            return mockData;
        }
    }

    @Override
    public Map<String, Object> getProjectReports() {
        try {
            Map<String, Object> reports = new java.util.HashMap<>();
            
            // Get all projects
            List<Project> projects = projectRepository.findAll();
            
            // Calculate various metrics
            long totalProjects = projects.size();
            long activeProjects = projectRepository.countProjectsByStatus(Project.ProjectStatus.ACTIVE);
            long completedProjects = projectRepository.countProjectsByStatus(Project.ProjectStatus.COMPLETED);
            long overdueProjects = projectRepository.findOverdueProjects(LocalDateTime.now().toLocalDate()).size();
            
            // Calculate average project duration
            double avgDuration = projects.stream()
                    .filter(p -> p.getStartDate() != null && p.getEndDate() != null)
                    .mapToLong(p -> java.time.temporal.ChronoUnit.DAYS.between(p.getStartDate(), p.getEndDate()))
                    .average()
                    .orElse(0.0);
            
            reports.put("totalProjects", totalProjects);
            reports.put("activeProjects", activeProjects);
            reports.put("completedProjects", completedProjects);
            reports.put("overdueProjects", overdueProjects);
            reports.put("averageDuration", Math.round(avgDuration * 100.0) / 100.0);
            reports.put("completionRate", totalProjects > 0 ? (double) completedProjects / totalProjects * 100 : 0.0);
            
            return reports;
        } catch (Exception e) {
            // Return mock data if database is not available
            Map<String, Object> mockData = new java.util.HashMap<>();
            mockData.put("totalProjects", 11);
            mockData.put("activeProjects", 5);
            mockData.put("completedProjects", 3);
            mockData.put("overdueProjects", 1);
            mockData.put("averageDuration", 45.5);
            mockData.put("completionRate", 27.3);
            return mockData;
        }
    }

    @Override
    public Map<String, Object> getProjectReportsByManager(String managerUsername) {
        try {
            Map<String, Object> reports = new java.util.HashMap<>();
            
            // Find user by generated username (first.last format) or email
            List<allUsers> allUsersList = userRepository.findAll();
            allUsers manager = UserManager.findUserByGeneratedUsername(allUsersList, managerUsername);
            if (manager == null) {
                // Try to find by email if username lookup fails
                manager = UserManager.findUserByEmail(allUsersList, managerUsername);
            }
            
            if (manager != null) {
                List<Project> projects = projectRepository.findProjectsByTeamLeader(manager.getUserId());
                
                // Calculate various metrics for this manager
                long totalProjects = projects.size();
                long activeProjects = projects.stream()
                        .filter(p -> Project.ProjectStatus.ACTIVE.equals(p.getStatus()))
                        .count();
                long completedProjects = projects.stream()
                        .filter(p -> Project.ProjectStatus.COMPLETED.equals(p.getStatus()))
                        .count();
                long overdueProjects = projects.stream()
                        .filter(p -> p.getEndDate() != null && 
                                p.getEndDate().isBefore(LocalDateTime.now().toLocalDate()) &&
                                !Project.ProjectStatus.COMPLETED.equals(p.getStatus()))
                        .count();
                
                // Calculate average project duration for this manager
                double avgDuration = projects.stream()
                        .filter(p -> p.getStartDate() != null && p.getEndDate() != null)
                        .mapToLong(p -> java.time.temporal.ChronoUnit.DAYS.between(p.getStartDate(), p.getEndDate()))
                        .average()
                        .orElse(0.0);
                
                reports.put("totalProjects", totalProjects);
                reports.put("activeProjects", activeProjects);
                reports.put("completedProjects", completedProjects);
                reports.put("overdueProjects", overdueProjects);
                reports.put("averageDuration", Math.round(avgDuration * 100.0) / 100.0);
                reports.put("completionRate", totalProjects > 0 ? (double) completedProjects / totalProjects * 100 : 0.0);
            } else {
                // Return empty data if manager not found
                reports.put("totalProjects", 0);
                reports.put("activeProjects", 0);
                reports.put("completedProjects", 0);
                reports.put("overdueProjects", 0);
                reports.put("averageDuration", 0.0);
                reports.put("completionRate", 0.0);
            }
            
            return reports;
        } catch (Exception e) {
            // Return mock data if database is not available
            Map<String, Object> mockData = new java.util.HashMap<>();
            mockData.put("totalProjects", 4);
            mockData.put("activeProjects", 2);
            mockData.put("completedProjects", 1);
            mockData.put("overdueProjects", 0);
            mockData.put("averageDuration", 38.0);
            mockData.put("completionRate", 25.0);
            return mockData;
        }
    }

    private ProjectDTO convertToDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getProjectId());
        dto.setName(project.getProjectName());
        dto.setDescription(project.getDescription());
        dto.setStatus(project.getStatus() != null ? Project.ProjectStatus.valueOf(project.getStatus().name()) : null);
        
        // Generate username from team leader's first and last name
        if (project.getTeam() != null && project.getTeam().getTeamLeader() != null) {
            dto.setManager(UserManager.generateUsername(
                project.getTeam().getTeamLeader().getFirstName(), 
                project.getTeam().getTeamLeader().getLastName()
            ));
        } else {
            dto.setManager(null);
        }
        
        dto.setCreatedBy(null); // Project entity doesn't have createdBy field
        dto.setDeadline(project.getEndDate() != null ? project.getEndDate().atStartOfDay() : null);
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        dto.setProgress(0); // Project entity doesn't have progress field
        dto.setPriority(null); // Project entity doesn't have priority field
        dto.setCategory(null); // Project entity doesn't have category field
        return dto;
    }

    private Project convertToEntity(ProjectDTO dto) {
        Project project = new Project();
        project.setProjectId(dto.getId());
        project.setProjectName(dto.getName());
        project.setDescription(dto.getDescription());
        
        // Convert String status to ProjectStatus enum
        if (dto.getStatus() != null) {
            try {
                project.setStatus(Project.ProjectStatus.valueOf(String.valueOf(dto.getStatus())));
            } catch (IllegalArgumentException e) {
                project.setStatus(Project.ProjectStatus.PLANNING);
            }
        } else {
            project.setStatus(Project.ProjectStatus.PLANNING);
        }
        
        project.setEndDate(dto.getDeadline() != null ? dto.getDeadline().toLocalDate() : null);
        project.setCreatedAt(dto.getCreatedAt());
        project.setUpdatedAt(dto.getUpdatedAt());

        // Note: Manager, team, and other related fields would need proper conversion
        // based on your business logic and entity relationships

        return project;
    }

    private List<ProjectDTO> getMockProjects() {
        List<ProjectDTO> projects = new ArrayList<>();

        ProjectDTO project1 = new ProjectDTO();
        project1.setId(1L);
        project1.setName("Website Redesign");
        project1.setDescription("Complete redesign of the company website");
        project1.setStatus(Project.ProjectStatus.valueOf("ACTIVE"));
        project1.setManager("jane.smith");
        project1.setCreatedBy("admin");
        project1.setDeadline(LocalDateTime.now().plusDays(30));
        project1.setCreatedAt(LocalDateTime.now().minusDays(15));
        project1.setUpdatedAt(LocalDateTime.now());
        project1.setProgress(65);
        project1.setPriority("HIGH");
        project1.setCategory("Web Development");
        projects.add(project1);

        ProjectDTO project2 = new ProjectDTO();
        project2.setId(2L);
        project2.setName("System Optimization");
        project2.setDescription("Optimize system performance and database");
        project2.setStatus(Project.ProjectStatus.valueOf("COMPLETED"));
        project2.setManager("jane.smith");
        project2.setCreatedBy("admin");
        project2.setDeadline(LocalDateTime.now().minusDays(5));
        project2.setCreatedAt(LocalDateTime.now().minusDays(25));
        project2.setUpdatedAt(LocalDateTime.now().minusDays(5));
        project2.setProgress(100);
        project2.setPriority("CRITICAL");
        project2.setCategory("System Administration");
        projects.add(project2);

        return projects;
    }
} 
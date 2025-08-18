package com.example.gpiApp.service;

import com.example.gpiApp.dto.ProjectDTO;
import java.util.List;
import java.util.Map;

public interface ProjectService {
    List<ProjectDTO> getAllProjects();
    List<ProjectDTO> getProjectsByManager(String managerUsername);
    List<ProjectDTO> getProjectsByUser(String username);
    ProjectDTO getProjectById(Long id);
    ProjectDTO createProject(ProjectDTO projectDTO);
    ProjectDTO updateProject(ProjectDTO projectDTO);
    boolean deleteProject(Long id);
    
    // Dashboard statistics
    Long getTotalProjectsCount();
    Long getProjectsCountByManager(String managerUsername);
    
    // Chart data
    Map<String, Object> getProjectProgressData();
    Map<String, Object> getProjectProgressByManager(String managerUsername);
    
    // Reports
    Map<String, Object> getProjectReports();
    Map<String, Object> getProjectReportsByManager(String managerUsername);

    Long getActiveProjectsCount();

    Long getCompletedProjectsCount();
}
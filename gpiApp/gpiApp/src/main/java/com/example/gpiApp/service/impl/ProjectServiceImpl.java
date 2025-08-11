package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.service.ProjectService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Override
    public List<ProjectDTO> getAllProjects() {
        List<ProjectDTO> projects = new ArrayList<>();
        
        ProjectDTO project1 = new ProjectDTO();
        project1.setId(1L);
        project1.setName("Website Redesign");
        project1.setDescription("Complete redesign of the company website");
        project1.setStatus("IN_PROGRESS");
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
        project2.setStatus("COMPLETED");
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

    @Override
    public List<ProjectDTO> getProjectsByManager(String managerUsername) {
        return getAllProjects().stream()
                .filter(project -> managerUsername.equals(project.getManager()))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }

    @Override
    public List<ProjectDTO> getProjectsByUser(String username) {
        // For now, return all projects
        return getAllProjects();
    }

    @Override
    public ProjectDTO getProjectById(Long id) {
        return getAllProjects().stream()
                .filter(project -> id.equals(project.getId()))
                .findFirst()
                .orElse(null);
    }

    @Override
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        projectDTO.setId(System.currentTimeMillis());
        projectDTO.setCreatedAt(LocalDateTime.now());
        projectDTO.setUpdatedAt(LocalDateTime.now());
        return projectDTO;
    }

    @Override
    public ProjectDTO updateProject(ProjectDTO projectDTO) {
        projectDTO.setUpdatedAt(LocalDateTime.now());
        return projectDTO;
    }

    @Override
    public boolean deleteProject(Long id) {
        return true;
    }

    @Override
    public Long getTotalProjectsCount() {
        return 12L;
    }

    @Override
    public Long getProjectsCountByManager(String managerUsername) {
        return 5L;
    }

    @Override
    public Map<String, Object> getProjectProgressData() {
        Map<String, Object> progress = new HashMap<>();
        progress.put("completed", 4);
        progress.put("inProgress", 6);
        progress.put("pending", 2);
        progress.put("averageProgress", 68.5);
        return progress;
    }

    @Override
    public Map<String, Object> getProjectProgressByManager(String managerUsername) {
        Map<String, Object> progress = new HashMap<>();
        progress.put("completed", 2);
        progress.put("inProgress", 3);
        progress.put("pending", 0);
        progress.put("averageProgress", 72.3);
        return progress;
    }

    @Override
    public Map<String, Object> getProjectReports() {
        Map<String, Object> reports = new HashMap<>();
        reports.put("totalProjects", 12);
        reports.put("completedProjects", 4);
        reports.put("inProgressProjects", 6);
        reports.put("overdueProjects", 2);
        return reports;
    }

    @Override
    public Map<String, Object> getProjectReportsByManager(String managerUsername) {
        Map<String, Object> reports = new HashMap<>();
        reports.put("totalProjects", 5);
        reports.put("completedProjects", 2);
        reports.put("inProgressProjects", 3);
        reports.put("overdueProjects", 0);
        return reports;
    }
} 
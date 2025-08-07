package com.example.gpiApp.service;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.entity.Project;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ProjectService {
    ProjectDTO createProject(ProjectDTO projectDTO);
    
    ProjectDTO updateProject(Long projectId, ProjectDTO projectDTO);
    
    void deleteProject(Long projectId);
    
    Optional<ProjectDTO> getProjectById(Long projectId);
    
    List<ProjectDTO> getAllProjects();
    
    List<ProjectDTO> getProjectsByTeam(Long teamId);
    
    List<ProjectDTO> getProjectsByStatus(Project.ProjectStatus status);
    
    List<ProjectDTO> getProjectsByTeamAndStatus(Long teamId, Project.ProjectStatus status);
    
    List<ProjectDTO> getActiveProjectsOnDate(LocalDate date);
    
    List<ProjectDTO> getProjectsByTeamLeader(Long leaderId);
    
    List<ProjectDTO> getOverdueProjects();
    
    long countProjectsByStatus(Project.ProjectStatus status);
    
    ProjectDTO updateProjectStatus(Long projectId, Project.ProjectStatus status);
    
    ProjectDTO assignProjectToTeam(Long projectId, Long teamId);
} 
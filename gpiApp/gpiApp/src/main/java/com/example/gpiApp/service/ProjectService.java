package com.example.gpiApp.service;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.entity.Project;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectService {
    ProjectDTO createProject(ProjectDTO projectDTO);
    
    ProjectDTO updateProject(UUID projectId, ProjectDTO projectDTO);
    
    void deleteProject(UUID projectId);
    
    Optional<ProjectDTO> getProjectById(UUID projectId);
    
    List<ProjectDTO> getAllProjects();
    
    List<ProjectDTO> getProjectsByTeam(UUID teamId);
    
    List<ProjectDTO> getProjectsByStatus(Project.ProjectStatus status);
    
    List<ProjectDTO> getProjectsByTeamAndStatus(UUID teamId, Project.ProjectStatus status);
    
    List<ProjectDTO> getActiveProjectsOnDate(LocalDate date);
    
    List<ProjectDTO> getProjectsByTeamLeader(UUID leaderId);
    
    List<ProjectDTO> getOverdueProjects();
    
    long countProjectsByStatus(Project.ProjectStatus status);
    
    ProjectDTO updateProjectStatus(UUID projectId, Project.ProjectStatus status);
    
    ProjectDTO assignProjectToTeam(UUID projectId, UUID teamId);
} 
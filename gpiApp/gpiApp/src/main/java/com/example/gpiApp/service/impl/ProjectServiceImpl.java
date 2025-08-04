package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Team;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TeamRepository;
import com.example.gpiApp.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectServiceImpl implements ProjectService {
    
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    
    @Override
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        Optional<Team> teamOpt = teamRepository.findById(projectDTO.getTeamId());
        if (teamOpt.isPresent()) {
            Project project = Project.builder()
                    .projectName(projectDTO.getProjectName())
                    .description(projectDTO.getDescription())
                    .team(teamOpt.get())
                    .status(projectDTO.getStatus())
                    .startDate(projectDTO.getStartDate())
                    .endDate(projectDTO.getEndDate())
                    .build();
            
            Project savedProject = projectRepository.save(project);
            return convertToDTO(savedProject);
        }
        throw new RuntimeException("Team not found");
    }
    
    @Override
    public ProjectDTO updateProject(UUID projectId, ProjectDTO projectDTO) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            project.setProjectName(projectDTO.getProjectName());
            project.setDescription(projectDTO.getDescription());
            project.setStatus(projectDTO.getStatus());
            project.setStartDate(projectDTO.getStartDate());
            project.setEndDate(projectDTO.getEndDate());
            
            if (projectDTO.getTeamId() != null) {
                Optional<Team> teamOpt = teamRepository.findById(projectDTO.getTeamId());
                teamOpt.ifPresent(project::setTeam);
            }
            
            Project updatedProject = projectRepository.save(project);
            return convertToDTO(updatedProject);
        }
        throw new RuntimeException("Project not found");
    }
    
    @Override
    public void deleteProject(UUID projectId) {
        projectRepository.deleteById(projectId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<ProjectDTO> getProjectById(UUID projectId) {
        return projectRepository.findById(projectId).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByTeam(UUID teamId) {
        return projectRepository.findByTeamTeamId(teamId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByStatus(Project.ProjectStatus status) {
        return projectRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByTeamAndStatus(UUID teamId, Project.ProjectStatus status) {
        return projectRepository.findByTeamAndStatus(teamId, status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getActiveProjectsOnDate(LocalDate date) {
        return projectRepository.findActiveProjectsOnDate(date).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByTeamLeader(UUID leaderId) {
        return projectRepository.findProjectsByTeamLeader(leaderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getOverdueProjects() {
        return projectRepository.findOverdueProjects(LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countProjectsByStatus(Project.ProjectStatus status) {
        return projectRepository.countProjectsByStatus(status);
    }
    
    @Override
    public ProjectDTO updateProjectStatus(UUID projectId, Project.ProjectStatus status) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            project.setStatus(status);
            Project updatedProject = projectRepository.save(project);
            return convertToDTO(updatedProject);
        }
        throw new RuntimeException("Project not found");
    }
    
    @Override
    public ProjectDTO assignProjectToTeam(UUID projectId, UUID teamId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        
        if (projectOpt.isPresent() && teamOpt.isPresent()) {
            Project project = projectOpt.get();
            project.setTeam(teamOpt.get());
            Project updatedProject = projectRepository.save(project);
            return convertToDTO(updatedProject);
        }
        throw new RuntimeException("Project or Team not found");
    }
    
    private ProjectDTO convertToDTO(Project project) {
        return ProjectDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .teamId(project.getTeam().getTeamId())
                .teamName(project.getTeam().getTeamName())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .taskCount(project.getTasks() != null ? project.getTasks().size() : 0)
                .completedTaskCount(project.getTasks() != null ? 
                    (int) project.getTasks().stream()
                        .filter(task -> task.getStatus() == com.example.gpiApp.entity.Task.TaskStatus.COMPLETED)
                        .count() : 0)
                .inProgressTaskCount(project.getTasks() != null ? 
                    (int) project.getTasks().stream()
                        .filter(task -> task.getStatus() == com.example.gpiApp.entity.Task.TaskStatus.IN_PROGRESS)
                        .count() : 0)
                .build();
    }
} 
package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.ProjectDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Team;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TeamRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.ProjectService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public ProjectServiceImpl(ProjectRepository projectRepository,
                              TeamRepository teamRepository,
                              UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByManager(String managerUsername) {
        // Simplification: return all for now unless team/manager mapping exists
        return getAllProjects();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByUser(String username) {
        // Simplification: return all for now
        return getAllProjects();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        return projectRepository.findById(id).map(this::toDTO).orElse(null);
    }

    @Override
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        Project project = new Project();
        project.setProjectName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        project.setStatus(Project.ProjectStatus.ACTIVE);

        Project saved = projectRepository.save(project);
        return toDTO(saved);
    }

    @Override
    public ProjectDTO updateProject(ProjectDTO projectDTO) {
        if (projectDTO.getId() == null) return null;
        Optional<Project> opt = projectRepository.findById(projectDTO.getId());
        if (opt.isEmpty()) return null;
        Project project = opt.get();
        if (projectDTO.getName() != null) project.setProjectName(projectDTO.getName());
        if (projectDTO.getDescription() != null) project.setDescription(projectDTO.getDescription());
        Project saved = projectRepository.save(project);
        return toDTO(saved);
    }

    @Override
    public boolean deleteProject(Long id) {
        if (!projectRepository.existsById(id)) return false;
        projectRepository.deleteById(id);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTotalProjectsCount() {
        return projectRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getProjectsCountByManager(String managerUsername) {
        return projectRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectProgressData() {
        Map<String, Object> progress = new HashMap<>();
        progress.put("completed", 0);
        progress.put("inProgress", 0);
        progress.put("pending", 0);
        progress.put("averageProgress", 0);
        return progress;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectProgressByManager(String managerUsername) {
        return getProjectProgressData();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectReports() {
        Map<String, Object> reports = new HashMap<>();
        reports.put("totalProjects", projectRepository.count());
        return reports;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectReportsByManager(String managerUsername) {
        return getProjectReports();
    }

    private ProjectDTO toDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getProjectId());
        dto.setName(project.getProjectName());
        dto.setDescription(project.getDescription());
        dto.setStatus(project.getStatus() != null ? project.getStatus().name() : null);

        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }
}
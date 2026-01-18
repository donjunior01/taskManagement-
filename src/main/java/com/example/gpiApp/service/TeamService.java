package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.Team;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TeamRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {
    
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    
    @Transactional(readOnly = true)
    public PagedResponse<TeamDTO> getAllTeams(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, size, sort);
        Page<Team> teamPage = teamRepository.findAll(pageable);
        
        List<TeamDTO> teamDTOs = teamPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(teamDTOs, teamPage.getNumber(), teamPage.getSize(),
                teamPage.getTotalElements(), teamPage.getTotalPages(),
                teamPage.isFirst(), teamPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<TeamDTO> getTeamById(Long id) {
        return teamRepository.findById(id)
                .map(team -> ApiResponse.success("Team retrieved successfully", convertToDTO(team)))
                .orElse(ApiResponse.error("Team not found"));
    }
    
    @Transactional
    public ApiResponse<TeamDTO> createTeam(TeamRequestDTO request, Long createdById) {
        Team team = new Team();
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        
        if (request.getProjectId() != null) {
            projectRepository.findById(request.getProjectId())
                    .ifPresent(team::setProject);
        }
        
        if (request.getManagerId() != null) {
            userRepository.findById(request.getManagerId())
                    .ifPresent(team::setManager);
        }
        
        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            List<allUsers> members = userRepository.findAllById(request.getMemberIds());
            team.setMembers(members);
        }
        
        Team savedTeam = teamRepository.save(team);
        
        // Log activity
        userRepository.findById(createdById).ifPresent(user -> 
            activityLogService.logActivity(
                ActivityLog.ActivityType.TEAM_CREATED,
                "Team '" + savedTeam.getName() + "' was created",
                user,
                "TEAM",
                savedTeam.getId(),
                null
            )
        );
        
        return ApiResponse.success("Team created successfully", convertToDTO(savedTeam));
    }
    
    @Transactional
    public ApiResponse<TeamDTO> updateTeam(Long id, TeamRequestDTO request, Long updatedById) {
        return teamRepository.findById(id)
                .map(team -> {
                    team.setName(request.getName());
                    team.setDescription(request.getDescription());
                    
                    if (request.getProjectId() != null) {
                        projectRepository.findById(request.getProjectId())
                                .ifPresent(team::setProject);
                    }
                    
                    if (request.getManagerId() != null) {
                        userRepository.findById(request.getManagerId())
                                .ifPresent(team::setManager);
                    }
                    
                    if (request.getMemberIds() != null) {
                        List<allUsers> members = userRepository.findAllById(request.getMemberIds());
                        team.setMembers(members);
                    }
                    
                    Team updatedTeam = teamRepository.save(team);
                    
                    // Log activity
                    userRepository.findById(updatedById).ifPresent(user -> 
                        activityLogService.logActivity(
                            ActivityLog.ActivityType.TEAM_UPDATED,
                            "Team '" + updatedTeam.getName() + "' was updated",
                            user,
                            "TEAM",
                            updatedTeam.getId(),
                            null
                        )
                    );
                    
                    return ApiResponse.success("Team updated successfully", convertToDTO(updatedTeam));
                })
                .orElse(ApiResponse.error("Team not found"));
    }
    
    @Transactional
    public ApiResponse<Void> deleteTeam(Long id, Long deletedById) {
        return teamRepository.findById(id)
                .map(team -> {
                    String teamName = team.getName();
                    teamRepository.delete(team);
                    
                    // Log activity
                    userRepository.findById(deletedById).ifPresent(user -> 
                        activityLogService.logActivity(
                            ActivityLog.ActivityType.TEAM_DELETED,
                            "Team '" + teamName + "' was deleted",
                            user,
                            "TEAM",
                            id,
                            null
                        )
                    );
                    
                    return ApiResponse.<Void>success("Team deleted successfully", null);
                })
                .orElse(ApiResponse.error("Team not found"));
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<TeamDTO> getTeamsByProject(Long projectId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Team> teamPage = teamRepository.findByProjectId(projectId, pageable);
        
        List<TeamDTO> teamDTOs = teamPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(teamDTOs, teamPage.getNumber(), teamPage.getSize(),
                teamPage.getTotalElements(), teamPage.getTotalPages(),
                teamPage.isFirst(), teamPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public List<TeamDTO> getTeamsByMember(Long userId) {
        List<Team> teams = teamRepository.findByMemberId(userId);
        return teams.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ApiResponse<TeamDTO> addMemberToTeam(Long teamId, Long userId) {
        return teamRepository.findById(teamId)
                .map(team -> {
                    userRepository.findById(userId).ifPresent(user -> {
                        if (!team.getMembers().contains(user)) {
                            team.getMembers().add(user);
                            teamRepository.save(team);
                        }
                    });
                    return ApiResponse.success("Member added to team successfully", convertToDTO(team));
                })
                .orElse(ApiResponse.error("Team not found"));
    }
    
    @Transactional
    public ApiResponse<TeamDTO> removeMemberFromTeam(Long teamId, Long userId) {
        return teamRepository.findById(teamId)
                .map(team -> {
                    team.getMembers().removeIf(user -> user.getId().equals(userId));
                    Team updatedTeam = teamRepository.save(team);
                    return ApiResponse.success("Member removed from team successfully", convertToDTO(updatedTeam));
                })
                .orElse(ApiResponse.error("Team not found"));
    }
    
    private TeamDTO convertToDTO(Team team) {
        List<UserDTO> memberDTOs = team.getMembers() != null ? 
                team.getMembers().stream()
                        .map(this::convertUserToDTO)
                        .collect(Collectors.toList()) : 
                new ArrayList<>();
        
        return TeamDTO.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .projectId(team.getProject() != null ? team.getProject().getId() : null)
                .projectName(team.getProject() != null ? team.getProject().getName() : null)
                .managerId(team.getManager() != null ? team.getManager().getId() : null)
                .managerName(team.getManager() != null ? 
                        team.getManager().getFirstName() + " " + team.getManager().getLastName() : null)
                .members(memberDTOs)
                .memberCount(memberDTOs.size())
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
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
}


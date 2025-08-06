package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.TeamDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.entity.Team;
import com.example.gpiApp.entity.UserTeam;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.TeamRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.UserTeamRepository;
import com.example.gpiApp.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamServiceImpl implements TeamService {
    
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final UserTeamRepository userTeamRepository;
    
    @Override
    public TeamDTO createTeam(TeamDTO teamDTO) {
        Team team = Team.builder()
                .teamName(teamDTO.getTeamName())
                .description(teamDTO.getDescription())
                .isActive(true)
                .build();
        
        if (teamDTO.getTeamLeaderId() != null) {
            Optional<allUsers> leader = userRepository.findById(teamDTO.getTeamLeaderId());
            leader.ifPresent(team::setTeamLeader);
        }
        
        Team savedTeam = teamRepository.save(team);
        return convertToDTO(savedTeam);
    }
    
    @Override
    public TeamDTO updateTeam(Long teamId, TeamDTO teamDTO) {
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        if (teamOpt.isPresent()) {
            Team team = teamOpt.get();
            team.setTeamName(teamDTO.getTeamName());
            team.setDescription(teamDTO.getDescription());
            
            if (teamDTO.getTeamLeaderId() != null) {
                Optional<allUsers> leader = userRepository.findById(teamDTO.getTeamLeaderId());
                leader.ifPresent(team::setTeamLeader);
            }
            
            Team updatedTeam = teamRepository.save(team);
            return convertToDTO(updatedTeam);
        }
        throw new RuntimeException("Team not found");
    }
    
    @Override
    public void deleteTeam(Long teamId) {
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        if (teamOpt.isPresent()) {
            Team team = teamOpt.get();
            team.setIsActive(false);
            teamRepository.save(team);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<TeamDTO> getTeamById(Long teamId) {
        return teamRepository.findById(teamId).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TeamDTO> getActiveTeams() {
        return teamRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TeamDTO> getTeamsByLeader(Long leaderId) {
        return teamRepository.findByTeamLeaderUserId(leaderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TeamDTO> getTeamsByMember(Long memberId) {
        return teamRepository.findTeamsByMember(memberId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public TeamDTO addMemberToTeam(Long teamId, Long userId) {
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        Optional<allUsers> userOpt = userRepository.findById(userId);
        
        if (teamOpt.isPresent() && userOpt.isPresent()) {
            UserTeam userTeam = UserTeam.builder()
                    .team(teamOpt.get())
                    .user(userOpt.get())
                    .isActive(true)
                    .build();
            userTeamRepository.save(userTeam);
            return convertToDTO(teamOpt.get());
        }
        throw new RuntimeException("Team or User not found");
    }
    
    @Override
    public TeamDTO removeMemberFromTeam(Long teamId, Long userId) {
        Optional<UserTeam> userTeamOpt = userTeamRepository.findByTeamTeamIdAndUserUserId(teamId, userId);
        if (userTeamOpt.isPresent()) {
            UserTeam userTeam = userTeamOpt.get();
            userTeam.setIsActive(false);
            userTeamRepository.save(userTeam);
            
            Optional<Team> teamOpt = teamRepository.findById(teamId);
            return teamOpt.map(this::convertToDTO).orElse(null);
        }
        throw new RuntimeException("Team membership not found");
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getTeamMembers(Long teamId) {
        return userTeamRepository.findByTeamTeamIdAndIsActiveTrue(teamId).stream()
                .map(userTeam -> convertUserToDTO(userTeam.getUser()))
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countActiveTeams() {
        return teamRepository.countActiveTeams();
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsByTeamName(String teamName) {
        return teamRepository.existsByTeamName(teamName);
    }
    
    @Override
    public TeamDTO assignTeamLeader(Long teamId, Long leaderId) {
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        Optional<allUsers> leaderOpt = userRepository.findById(leaderId);
        
        if (teamOpt.isPresent() && leaderOpt.isPresent()) {
            Team team = teamOpt.get();
            team.setTeamLeader(leaderOpt.get());
            Team updatedTeam = teamRepository.save(team);
            return convertToDTO(updatedTeam);
        }
        throw new RuntimeException("Team or Leader not found");
    }
    
    private TeamDTO convertToDTO(Team team) {
        return TeamDTO.builder()
                .teamId(team.getTeamId())
                .teamName(team.getTeamName())
                .description(team.getDescription())
                .teamLeaderId(team.getTeamLeader() != null ? team.getTeamLeader().getUserId() : null)
                .teamLeaderName(team.getTeamLeader() != null ? 
                    team.getTeamLeader().getFirstName() + " " + team.getTeamLeader().getLastName() : null)
                .isActive(team.getIsActive())
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .memberCount((int) team.getUserTeams().stream().filter(UserTeam::getIsActive).count())
                .build();
    }
    
    private UserDTO convertUserToDTO(allUsers user) {
        return UserDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .profilePictureUrl(user.getProfilePictureUrl())
                .userRole(user.getUserRole())
                .userPost(user.getUserPost())
                .isActive(user.getIsActive())
                .build();
    }
} 
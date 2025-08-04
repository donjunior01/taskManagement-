package com.example.gpiApp.service;

import com.example.gpiApp.dto.TeamDTO;
import com.example.gpiApp.dto.UserDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamService {
    TeamDTO createTeam(TeamDTO teamDTO);
    
    TeamDTO updateTeam(UUID teamId, TeamDTO teamDTO);
    
    void deleteTeam(UUID teamId);
    
    Optional<TeamDTO> getTeamById(UUID teamId);
    
    List<TeamDTO> getAllTeams();
    
    List<TeamDTO> getActiveTeams();
    
    List<TeamDTO> getTeamsByLeader(UUID leaderId);
    
    List<TeamDTO> getTeamsByMember(UUID memberId);
    
    TeamDTO addMemberToTeam(UUID teamId, UUID userId);
    
    TeamDTO removeMemberFromTeam(UUID teamId, UUID userId);
    
    List<UserDTO> getTeamMembers(UUID teamId);
    
    long countActiveTeams();
    
    boolean existsByTeamName(String teamName);
    
    TeamDTO assignTeamLeader(UUID teamId, UUID leaderId);
} 
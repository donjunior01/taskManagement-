package com.example.gpiApp.service;

import com.example.gpiApp.dto.TeamDTO;
import com.example.gpiApp.dto.UserDTO;

import java.util.List;
import java.util.Optional;

public interface TeamService {
    TeamDTO createTeam(TeamDTO teamDTO);
    
    TeamDTO updateTeam(Long teamId, TeamDTO teamDTO);
    
    void deleteTeam(Long teamId);
    
    Optional<TeamDTO> getTeamById(Long teamId);
    
    List<TeamDTO> getAllTeams();
    
    List<TeamDTO> getActiveTeams();
    
    List<TeamDTO> getTeamsByLeader(Long leaderId);
    
    List<TeamDTO> getTeamsByMember(Long memberId);
    
    TeamDTO addMemberToTeam(Long teamId, Long userId);
    
    TeamDTO removeMemberFromTeam(Long teamId, Long userId);
    
    List<UserDTO> getTeamMembers(Long teamId);
    
    long countActiveTeams();
    
    boolean existsByTeamName(String teamName);
    
    TeamDTO assignTeamLeader(Long teamId, Long leaderId);
} 
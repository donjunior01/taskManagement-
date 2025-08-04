package com.example.gpiApp.controller;

import com.example.gpiApp.dto.TeamDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeamController {
    
    private final TeamService teamService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TeamDTO>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TeamDTO>> getActiveTeams() {
        return ResponseEntity.ok(teamService.getActiveTeams());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TeamDTO> getTeamById(@PathVariable UUID id) {
        return teamService.getTeamById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TeamDTO> createTeam(@RequestBody TeamDTO teamDTO) {
        return ResponseEntity.ok(teamService.createTeam(teamDTO));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TeamDTO> updateTeam(@PathVariable UUID id, @RequestBody TeamDTO teamDTO) {
        return ResponseEntity.ok(teamService.updateTeam(id, teamDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable UUID id) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/leader/{leaderId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TeamDTO>> getTeamsByLeader(@PathVariable UUID leaderId) {
        return ResponseEntity.ok(teamService.getTeamsByLeader(leaderId));
    }
    
    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TeamDTO>> getTeamsByMember(@PathVariable UUID memberId) {
        return ResponseEntity.ok(teamService.getTeamsByMember(memberId));
    }
    
    @PostMapping("/{teamId}/members/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TeamDTO> addMemberToTeam(@PathVariable UUID teamId, @PathVariable UUID userId) {
        return ResponseEntity.ok(teamService.addMemberToTeam(teamId, userId));
    }
    
    @DeleteMapping("/{teamId}/members/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TeamDTO> removeMemberFromTeam(@PathVariable UUID teamId, @PathVariable UUID userId) {
        return ResponseEntity.ok(teamService.removeMemberFromTeam(teamId, userId));
    }
    
    @GetMapping("/{teamId}/members")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<UserDTO>> getTeamMembers(@PathVariable UUID teamId) {
        return ResponseEntity.ok(teamService.getTeamMembers(teamId));
    }
    
    @PutMapping("/{teamId}/leader/{leaderId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<TeamDTO> assignTeamLeader(@PathVariable UUID teamId, @PathVariable UUID leaderId) {
        return ResponseEntity.ok(teamService.assignTeamLeader(teamId, leaderId));
    }
    
    @GetMapping("/count/active")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Long> getActiveTeamCount() {
        return ResponseEntity.ok(teamService.countActiveTeams());
    }
} 
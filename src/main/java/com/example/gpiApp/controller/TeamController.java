package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {
    
    private final TeamService teamService;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<PagedResponse<TeamDTO>> getAllTeams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(teamService.getAllTeams(page, size, sortBy, sortDir));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDTO>> getTeamById(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<TeamDTO>> createTeam(
            @RequestBody TeamRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(teamService.createTeam(request, userId));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDTO>> updateTeam(
            @PathVariable Long id,
            @RequestBody TeamRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(teamService.updateTeam(id, request, userId));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(teamService.deleteTeam(id, userId));
    }
    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<PagedResponse<TeamDTO>> getTeamsByProject(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(teamService.getTeamsByProject(projectId, page, size));
    }
    
    @GetMapping("/member/{userId}")
    public ResponseEntity<List<TeamDTO>> getTeamsByMember(@PathVariable Long userId) {
        return ResponseEntity.ok(teamService.getTeamsByMember(userId));
    }
    
    @PostMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<TeamDTO>> addMemberToTeam(
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(teamService.addMemberToTeam(teamId, userId));
    }
    
    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<TeamDTO>> removeMemberFromTeam(
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(teamService.removeMemberFromTeam(teamId, userId));
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null) {
            return userRepository.findByEmail(authentication.getName())
                    .map(allUsers::getId)
                    .orElse(null);
        }
        return null;
    }
}


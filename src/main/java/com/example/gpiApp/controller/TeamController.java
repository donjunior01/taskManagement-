package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team management operations")
public class TeamController {
    
    private final TeamService teamService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Get all teams", description = "Retrieve paginated list of all teams")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved teams"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping
    public ResponseEntity<PagedResponse<TeamDTO>> getAllTeams(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(teamService.getAllTeams(page, size, sortBy, sortDir));
    }
    
    @Operation(summary = "Get team by ID", description = "Retrieve a specific team by its ID")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Team found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Team not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDTO>> getTeamById(
            @Parameter(description = "Team ID") @PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }
    
    @Operation(summary = "Create team", description = "Create a new team")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Team created successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Manager or Admin role required")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<TeamDTO>> createTeam(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Team details") @RequestBody TeamRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(teamService.createTeam(request, userId));
    }
    
    @Operation(summary = "Update team", description = "Update an existing team")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Team updated successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Team not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDTO>> updateTeam(
            @Parameter(description = "Team ID") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Updated team details") @RequestBody TeamRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(teamService.updateTeam(id, request, userId));
    }
    
    @Operation(summary = "Delete team", description = "Delete a team")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Team deleted successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Team not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(
            @Parameter(description = "Team ID") @PathVariable Long id,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(teamService.deleteTeam(id, userId));
    }
    
    @Operation(summary = "Get teams by project", description = "Retrieve all teams for a specific project")
    @GetMapping("/project/{projectId}")
    public ResponseEntity<PagedResponse<TeamDTO>> getTeamsByProject(
            @Parameter(description = "Project ID") @PathVariable Long projectId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(teamService.getTeamsByProject(projectId, page, size));
    }
    
    @Operation(summary = "Get teams by member", description = "Retrieve all teams that a user is a member of")
    @GetMapping("/member/{userId}")
    public ResponseEntity<List<TeamDTO>> getTeamsByMember(
            @Parameter(description = "User ID") @PathVariable Long userId) {
        return ResponseEntity.ok(teamService.getTeamsByMember(userId));
    }
    
    @Operation(summary = "Add member to team", description = "Add a user as a member of a team")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member added successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Team or user not found")
    })
    @PostMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<TeamDTO>> addMemberToTeam(
            @Parameter(description = "Team ID") @PathVariable Long teamId,
            @Parameter(description = "User ID") @PathVariable Long userId) {
        return ResponseEntity.ok(teamService.addMemberToTeam(teamId, userId));
    }
    
    @Operation(summary = "Remove member from team", description = "Remove a user from a team")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member removed successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Team or user not found")
    })
    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<TeamDTO>> removeMemberFromTeam(
            @Parameter(description = "Team ID") @PathVariable Long teamId,
            @Parameter(description = "User ID") @PathVariable Long userId) {
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


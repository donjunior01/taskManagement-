package com.example.gpiApp.controller;

import com.example.gpiApp.dto.UserListResponseDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.dto.UserResponseDTO;
import com.example.gpiApp.repository.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "User management operations")
public class UserController {

    private final UserService userService;
    private final com.example.gpiApp.repository.UserRepository userRepository;

    @Autowired
    public UserController(UserService userService, com.example.gpiApp.repository.UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /** Resolve the authenticated caller's id (token subject is the email/username, or the id itself). */
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return null;
        String name = authentication.getName();
        try {
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            return userRepository.findByEmail(name)
                    .or(() -> userRepository.findByUsername(name))
                    .map(com.example.gpiApp.entity.allUsers::getId)
                    .orElse(null);
        }
    }

    @Operation(summary = "Get user list for messaging", description = "Retrieve a simplified list of users for messaging purposes")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved user list"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/list")
    public ResponseEntity<UserListResponseDTO> getUserList(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(userService.getAllUsers(page, size, "firstName", "asc"));
    }

    // Profile endpoint for authenticated users
    @GetMapping("/{id}/profile")
    public ResponseEntity<UserResponseDTO> getUserProfile(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // Update own profile
    @PutMapping("/{id}/profile")
    public ResponseEntity<UserResponseDTO> updateUserProfile(
            @PathVariable Long id,
            @RequestBody UserRequestDTO userRequestDTO,
            Authentication auth) {
        // Users can only update their own profile
        return ResponseEntity.ok(userService.updateUser(id, userRequestDTO));
    }

    // Change password endpoint
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> passwordData,
            Authentication auth) {
        String currentPassword = passwordData.get("currentPassword");
        String newPassword = passwordData.get("newPassword");
        
        try {
            userService.changePassword(auth.getName(), currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @Operation(summary = "Reset a user's password (admin)", description = "Resets the user's password to a policy-compliant temporary value and emails it")
    @PostMapping("/{id}/reset-password")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<com.example.gpiApp.dto.ApiResponse<Map<String, String>>> resetPassword(
            @Parameter(description = "User ID") @PathVariable Long id) {
        try {
            Map<String, String> result = userService.resetUserPassword(id);
            return ResponseEntity.ok(com.example.gpiApp.dto.ApiResponse.success(
                    "Mot de passe réinitialisé et envoyé à " + result.get("email"), result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(com.example.gpiApp.dto.ApiResponse.error(
                    e.getMessage() != null ? e.getMessage() : "Échec de la réinitialisation du mot de passe."));
        }
    }

    @Operation(summary = "Get all users", description = "Retrieve paginated list of all users")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved users"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin or Manager role required")
    })
    @GetMapping
    public ResponseEntity<UserListResponseDTO> getAllUsers(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(userService.getAllUsers(page, size, sortBy, sortDir));
    }

    @Operation(summary = "Get user by ID", description = "Retrieve a specific user by their ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User found"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(
            @Parameter(description = "User ID") @PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @Operation(summary = "Create new user", description = "Create a new user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin or Manager role required")
    })
    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody UserRequestDTO userRequestDTO) {
        return ResponseEntity.ok(userService.createUser(userRequestDTO));
    }

    @Operation(summary = "Update user", description = "Update an existing user's information")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User updated successfully"),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin or Manager role required")
    })
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(
            @Parameter(description = "User ID") @PathVariable Long id,
            @RequestBody UserRequestDTO userRequestDTO) {
        UserResponseDTO result = userService.updateUser(id, userRequestDTO);
        // Surface rejections (name/email taken, role-change guards) as 400 instead of a false "200 OK".
        return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @Operation(summary = "Delete user", description = "Delete a user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User deleted successfully"),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<UserResponseDTO> deleteUser(
            @Parameter(description = "User ID") @PathVariable Long id,
            Authentication authentication) {
        UserResponseDTO result = userService.deleteUser(id, getCurrentUserId(authentication));
        // Guard failures (self-delete, last admin, still managing projects) → 400 so the UI surfaces the reason.
        return result.isSuccess() ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @Operation(summary = "Toggle user status", description = "Activate or suspend a user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status toggled successfully"),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required")
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> toggleUserStatus(
            @Parameter(description = "User ID") @PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }

    @GetMapping("/filter")
    public ResponseEntity<UserListResponseDTO> filterUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(userService.filterUsers(role, status, page, size, sortBy, sortDir));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<UserListResponseDTO> getUsersByRole(
            @PathVariable String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(userService.filterUsers(role, null, page, size, "id", "asc"));
    }
} 
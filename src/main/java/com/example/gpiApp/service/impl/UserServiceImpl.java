package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.UserListResponseDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.dto.UserResponseDTO;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.entity.allUsers.Role;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.UserService;
import com.example.gpiApp.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final com.example.gpiApp.service.SystemSettingsService systemSettingsService;
    private final com.example.gpiApp.service.EmailService emailService;
    private final com.example.gpiApp.repository.ProjectRepository projectRepository;
    private final com.example.gpiApp.service.ActivityLogService activityLogService;
    private final com.example.gpiApp.repository.OrganizationRepository organizationRepository;
    private final com.example.gpiApp.service.PlanService planService;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, NotificationService notificationService,
                           com.example.gpiApp.service.SystemSettingsService systemSettingsService,
                           com.example.gpiApp.service.EmailService emailService,
                           com.example.gpiApp.repository.ProjectRepository projectRepository,
                           com.example.gpiApp.service.ActivityLogService activityLogService,
                           com.example.gpiApp.repository.OrganizationRepository organizationRepository,
                           com.example.gpiApp.service.PlanService planService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.systemSettingsService = systemSettingsService;
        this.emailService = emailService;
        this.projectRepository = projectRepository;
        this.activityLogService = activityLogService;
        this.organizationRepository = organizationRepository;
        this.planService = planService;
    }

    /** The admin/user performing the current request, resolved from the security context (for traceability). */
    private allUsers currentActor() {
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) return null;
            String name = auth.getName();
            try {
                return userRepository.findById(Long.parseLong(name)).orElse(null);
            } catch (NumberFormatException e) {
                return userRepository.findByEmail(name)
                        .orElseGet(() -> userRepository.findByUsername(name).orElse(null));
            }
        } catch (Exception e) {
            return null;
        }
    }

    /** Best-effort traceability log for an admin action on a user account. */
    private void logUserAction(com.example.gpiApp.entity.ActivityLog.ActivityType type, String description, Long targetUserId) {
        try {
            activityLogService.logActivity(type, description, currentActor(), "USER", targetUserId, null);
        } catch (Exception ignore) { /* never let logging break the action */ }
    }

    @Override
    @Transactional
    public java.util.Map<String, String> resetUserPassword(Long id) {
        allUsers user = userRepository.findById(id)
                .orElseThrow(() -> new com.example.gpiApp.exception.ResourceNotFoundException("User not found with id " + id));
        String tempPassword = systemSettingsService.generateCompliantPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setPasswordChangedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        // Best-effort email (no-op/logged when mail is disabled).
        try { emailService.sendPasswordResetEmail(user.getEmail(), tempPassword); } catch (Exception ignore) { }

        // In-app notification for the user.
        try {
            notificationService.createNotification(user.getId(),
                    "Mot de passe réinitialisé",
                    "Un administrateur a réinitialisé votre mot de passe. Vérifiez votre e-mail pour le mot de passe temporaire, puis modifiez-le.",
                    com.example.gpiApp.entity.Notification.NotificationType.SYSTEM, null, null,
                    "pwdReset", null);
        } catch (Exception ignore) { }

        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("email", user.getEmail());
        result.put("temporaryPassword", tempPassword);
        return result;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public UserListResponseDTO getAllUsers(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) 
            ? Sort.by(sortBy).ascending() 
            : Sort.by(sortBy).descending();
        
        PageRequest pageable = PageRequest.of(page, size, sort);
        Page<allUsers> usersPage = userRepository.findAll(pageable);
        
        List<UserDTO> userDTOs = usersPage.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
            
        return new UserListResponseDTO(
            true,
            "Users retrieved successfully",
            userDTOs,
            usersPage.getNumber(),
            usersPage.getSize(),
            usersPage.getTotalElements(),
            usersPage.getTotalPages(),
            usersPage.isFirst(),
            usersPage.isLast()
        );
    }

    @Override
    public UserResponseDTO getUserById(Long id) {
        Optional<allUsers> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            UserDTO userDTO = convertToDTO(userOptional.get());
            return new UserResponseDTO(true, "allUsers retrieved successfully", userDTO);
        }
        return new UserResponseDTO(false, "allUsers not found", null);
    }

    @Override
    public UserResponseDTO createUser(UserRequestDTO userRequestDTO) {
        System.out.println("Creating user with data: " + userRequestDTO);
        
        if (userRepository.existsByUsername(userRequestDTO.getUsername())) {
            System.out.println("Username already exists: " + userRequestDTO.getUsername());
            return new UserResponseDTO(false, "Username already exists", null);
        }
        if (userRepository.existsByEmail(userRequestDTO.getEmail())) {
            System.out.println("Email already exists: " + userRequestDTO.getEmail());
            return new UserResponseDTO(false, "Email already exists", null);
        }

        try {
            allUsers allUsers = new allUsers();
            updateUserFromDTO(allUsers, userRequestDTO);
            allUsers.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
            allUsers.setPasswordChangedAt(java.time.LocalDateTime.now());
            // Phase 1: new users created by an admin join the default tenant.
            if (allUsers.getOrganization() == null) organizationRepository.findById(1L).ifPresent(allUsers::setOrganization);
            // Plan enforcement: refuse to exceed the tenant's seat limit (default tenant is unlimited).
            Long targetOrgId = allUsers.getOrganization() != null ? allUsers.getOrganization().getId() : null;
            if (!planService.canAddUser(targetOrgId)) {
                return new UserResponseDTO(false, "Your plan's user limit has been reached. Upgrade to add more members.", null);
            }
            System.out.println("Saving allUsers: " + allUsers);
            allUsers savedAllUsers = userRepository.save(allUsers);
            System.out.println("allUsers saved successfully with ID: " + savedAllUsers.getId());
            notificationService.createNotification(
                savedAllUsers.getId(),
                "Welcome to the system!",
                "Your account has been created. You can now receive task assignments and project updates.",
                Notification.NotificationType.SYSTEM,
                null,
                null,
                "welcome",
                null
            );
            logUserAction(com.example.gpiApp.entity.ActivityLog.ActivityType.USER_CREATED,
                    "User account '" + savedAllUsers.getUsername() + "' (" + savedAllUsers.getRole() + ") was created",
                    savedAllUsers.getId());
            UserDTO userDTO = convertToDTO(savedAllUsers);
            return new UserResponseDTO(true, "allUsers created successfully", userDTO);
        } catch (Exception e) {
            System.out.println("Error creating user: " + e.getMessage());
            e.printStackTrace();
            return new UserResponseDTO(false, "Error creating user: " + e.getMessage(), null);
        }
    }

    @Override
    public UserResponseDTO updateUser(Long id, UserRequestDTO userRequestDTO) {
        System.out.println("Starting update for user ID: " + id);
        System.out.println("Update data received: " + userRequestDTO);
        
        Optional<allUsers> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            System.out.println("allUsers not found with ID: " + id);
            return new UserResponseDTO(false, "allUsers not found", null);
        }

        allUsers existingAllUsers = userOptional.get();
        System.out.println("Found existing user: " + existingAllUsers);

        try {
            // Only update fields that are provided (partial update support)
            // Check for duplicate username only if username is being changed and is not null
            if (userRequestDTO.getUsername() != null && !userRequestDTO.getUsername().isEmpty()) {
                if (!existingAllUsers.getUsername().equals(userRequestDTO.getUsername())
                    && userRepository.existsByUsername(userRequestDTO.getUsername())) {
                    System.out.println("Username already exists: " + userRequestDTO.getUsername());
                    return new UserResponseDTO(false, "Username already exists", null);
                }
                existingAllUsers.setUsername(userRequestDTO.getUsername());
            }

            // Check for duplicate email only if email is being changed and is not null
            if (userRequestDTO.getEmail() != null && !userRequestDTO.getEmail().isEmpty()) {
                if (!existingAllUsers.getEmail().equals(userRequestDTO.getEmail())
                    && userRepository.existsByEmail(userRequestDTO.getEmail())) {
                    System.out.println("Email already exists: " + userRequestDTO.getEmail());
                    return new UserResponseDTO(false, "Email already exists", null);
                }
                existingAllUsers.setEmail(userRequestDTO.getEmail());
            }

            // Update first name if provided
            if (userRequestDTO.getFirstName() != null && !userRequestDTO.getFirstName().isEmpty()) {
                existingAllUsers.setFirstName(userRequestDTO.getFirstName());
            }

            // Update last name if provided
            if (userRequestDTO.getLastName() != null && !userRequestDTO.getLastName().isEmpty()) {
                existingAllUsers.setLastName(userRequestDTO.getLastName());
            }
            
            // Handle role and status enums
            if (userRequestDTO.getRole() != null) {
                allUsers.Role oldRole = existingAllUsers.getRole();
                allUsers.Role newRole = allUsers.Role.valueOf(userRequestDTO.getRole().toString());
                if (oldRole != newRole) {
                    // Don't strip admin from the last active administrator.
                    if (oldRole == allUsers.Role.ADMIN && newRole != allUsers.Role.ADMIN
                            && userRepository.countActiveByRole(allUsers.Role.ADMIN) <= 1) {
                        return new UserResponseDTO(false, "Cannot change the role of the last active administrator.", null);
                    }
                    // Downgrading to a non-manager role while still managing projects would strand them.
                    if (newRole == allUsers.Role.USER) {
                        long managed = projectRepository.countActiveByManagerId(id);
                        if (managed > 0) {
                            return new UserResponseDTO(false,
                                    "This user manages " + managed + " active project(s). Reassign them to another manager before downgrading to a collaborator.",
                                    null);
                        }
                    }
                }
                existingAllUsers.setRole(newRole);
            }
            
            // Only update password if a new one is provided
            if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isEmpty()) {
                System.out.println("Updating password for user ID: " + id);
                existingAllUsers.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
                existingAllUsers.setPasswordChangedAt(java.time.LocalDateTime.now());
            }

            System.out.println("Saving updated user: " + existingAllUsers);
            allUsers updatedAllUsers = userRepository.save(existingAllUsers);
            System.out.println("allUsers saved successfully: " + updatedAllUsers);

            logUserAction(com.example.gpiApp.entity.ActivityLog.ActivityType.USER_UPDATED,
                    "User account '" + updatedAllUsers.getUsername() + "' was updated",
                    updatedAllUsers.getId());
            UserDTO userDTO = convertToDTO(updatedAllUsers);
            return new UserResponseDTO(true, "allUsers updated successfully", userDTO);
        } catch (Exception e) {
            System.out.println("Error updating user: " + e.getMessage());
            e.printStackTrace();
            return new UserResponseDTO(false, "Error updating user: " + e.getMessage(), null);
        }
    }

    @Override
    public UserResponseDTO deleteUser(Long id, Long actorId) {
        Optional<allUsers> target = userRepository.findById(id);
        if (target.isEmpty()) {
            return new UserResponseDTO(false, "User not found", null);
        }
        allUsers user = target.get();

        // Guard 1 — you can't remove your own account.
        if (actorId != null && actorId.equals(id)) {
            return new UserResponseDTO(false, "You cannot delete your own account.", null);
        }
        // Guard 2 — never remove the last active administrator (would lock everyone out of admin).
        if (user.getRole() == allUsers.Role.ADMIN && userRepository.countActiveByRole(allUsers.Role.ADMIN) <= 1) {
            return new UserResponseDTO(false, "Cannot delete the last active administrator.", null);
        }
        // Guard 3 — a manager must hand off their active projects first (prevents orphaning).
        long managed = projectRepository.countActiveByManagerId(id);
        if (managed > 0) {
            return new UserResponseDTO(false,
                    "This user still manages " + managed + " active project(s). Reassign them to another manager before removing the account.",
                    null);
        }

        // Soft delete: deactivate rather than destroy, so the audit trail and the user's contributions
        // (time logs, comments, deliverables, history) are preserved. Login is already blocked for
        // inactive accounts, and an admin can reactivate later if needed.
        String username = user.getUsername();
        user.setActive(false);
        userRepository.save(user);
        logUserAction(com.example.gpiApp.entity.ActivityLog.ActivityType.USER_DELETED,
                "User account '" + username + "' was deactivated (soft delete)", id);
        return new UserResponseDTO(true, "User account deactivated.", null);
    }

    @Override
    public UserListResponseDTO filterUsers(String role, String status, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) 
            ? Sort.by(sortBy).ascending() 
            : Sort.by(sortBy).descending();
        
        PageRequest pageable = PageRequest.of(page, size, sort);
        Page<allUsers> usersPage;
        
        if (role != null) {
            usersPage = userRepository.findByRole(
                allUsers.Role.valueOf(role.toUpperCase()),
                pageable
            );
        } else {
            usersPage = userRepository.findAll(pageable);
        }
        
        List<UserDTO> userDTOs = usersPage.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
            
        return new UserListResponseDTO(
            true,
            "Users filtered successfully",
            userDTOs,
            usersPage.getNumber(),
            usersPage.getSize(),
            usersPage.getTotalElements(),
            usersPage.getTotalPages(),
            usersPage.isFirst(),
            usersPage.isLast()
        );
    }

    @Override
    @Transactional
    public UserResponseDTO toggleUserStatus(Long id) {
        Optional<allUsers> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return new UserResponseDTO(false, "User not found", null);
        }
        allUsers user = userOptional.get();
        boolean newStatus = !user.isActive();
        
        // Execute clean modifying update to prevent entity merge lockups
        userRepository.updateUserStatus(id, newStatus);
        
        // Retrieve fresh state
        allUsers updatedUser = userRepository.findById(id).orElse(user);
        
        String status = updatedUser.isActive() ? "activated" : "suspended";
        logUserAction(com.example.gpiApp.entity.ActivityLog.ActivityType.USER_UPDATED,
                "User account '" + updatedUser.getUsername() + "' was " + status, id);
        return new UserResponseDTO(true, "User account " + status + " successfully", convertToDTO(updatedUser));
    }

    @Override
    public void changePassword(String email, String currentPassword, String newPassword) {
        allUsers user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
    }

    private UserDTO convertToDTO(allUsers allUsers) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(allUsers.getId());
        userDTO.setUsername(allUsers.getUsername());
        userDTO.setEmail(allUsers.getEmail());
        userDTO.setPassword(allUsers.getPassword());
        userDTO.setFirstName(allUsers.getFirstName());
        userDTO.setLastName(allUsers.getLastName());
        userDTO.setRole(allUsers.getRole());
        userDTO.setFullName(allUsers.getFirstName() + " " + allUsers.getLastName());
        userDTO.setActive(allUsers.isActive());
        userDTO.setCreatedAt(allUsers.getCreatedAt());
        try {
            if (allUsers.getCustomRole() != null) {
                userDTO.setCustomRoleId(allUsers.getCustomRole().getId());
                userDTO.setCustomRoleName(allUsers.getCustomRole().getName());
            }
        } catch (Exception ignore) { /* lazy custom role not loaded */ }
        // Admins → projects they personally created (per-admin traceability); everyone else → their own projects.
        try {
            userDTO.setProjectCount(allUsers.getRole() == Role.ADMIN
                    ? projectRepository.countByCreatedById(allUsers.getId())
                    : projectRepository.countProjectsByUser(allUsers.getId()));
        } catch (Exception e) {
            userDTO.setProjectCount(0L);
        }
        return userDTO;
    }

    private void updateUserFromDTO(allUsers allUsers, UserRequestDTO userRequestDTO) {
        allUsers.setUsername(userRequestDTO.getUsername());
        allUsers.setEmail(userRequestDTO.getEmail());
        allUsers.setFirstName(userRequestDTO.getFirstName());
        allUsers.setLastName(userRequestDTO.getLastName());
        allUsers.setRole(Role.valueOf(userRequestDTO.getRole().toString()));
    }
} 
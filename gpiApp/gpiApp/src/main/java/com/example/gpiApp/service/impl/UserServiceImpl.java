package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserByUsername(String username) {
        return userRepository.findByEmail(username)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Override
    public UserDTO createUser(UserDTO userDTO) {
        try {
            allUsers user = allUsers.builder()
                    .email(userDTO.getEmail())
                    .firstName(userDTO.getName() != null ? userDTO.getName().split(" ")[0] : "")
                    .lastName(userDTO.getName() != null && userDTO.getName().split(" ").length > 1 ? userDTO.getName().split(" ")[1] : "")
                    .userRole(allUsers.UserRole.valueOf(userDTO.getRole() != null ? userDTO.getRole() : "EMPLOYEE"))
                    .userPost(allUsers.UserPost.valueOf(userDTO.getDepartment() != null ? userDTO.getDepartment() : "DEVELOPER"))
                    .profilePictureUrl(userDTO.getAvatar())
                    .isActive(true)
                    .passwordHash("defaultPassword123") // Set a default password
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            allUsers savedUser = userRepository.save(user);
            return convertToDTO(savedUser);
        } catch (Exception e) {
            throw new RuntimeException("Error creating user: " + e.getMessage(), e);
        }
    }

    @Override
    public UserDTO updateUser(UserDTO userDTO) {
        try {
            return userRepository.findById(userDTO.getId())
                    .map(user -> {
                        user.setEmail(userDTO.getEmail());
                        user.setFirstName(userDTO.getName() != null ? userDTO.getName().split(" ")[0] : "");
                        user.setLastName(userDTO.getName() != null && userDTO.getName().split(" ").length > 1 ? userDTO.getName().split(" ")[1] : "");
                        user.setUserRole(allUsers.UserRole.valueOf(userDTO.getRole() != null ? userDTO.getRole() : "EMPLOYEE"));
                        user.setUserPost(allUsers.UserPost.valueOf(userDTO.getDepartment() != null ? userDTO.getDepartment() : "DEVELOPER"));
                        user.setProfilePictureUrl(userDTO.getAvatar());
                        user.setIsActive(true);
                        user.setUpdatedAt(LocalDateTime.now());
                        
                        allUsers updatedUser = userRepository.save(user);
                        return convertToDTO(updatedUser);
                    })
                    .orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error updating user: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public String getUserRole(String username) {
        return String.valueOf(userRepository.findByEmail(username)
                .map(allUsers::getUserRole)
                .orElse(allUsers.UserRole.valueOf("USER")));
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTotalUsersCount() {
        return userRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUserActivityData() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();
        long inactiveUsers = totalUsers - activeUsers;
        
        Map<String, Object> activity = new HashMap<>();
        activity.put("activeUsers", activeUsers);
        activity.put("inactiveUsers", inactiveUsers);
        activity.put("newUsersThisWeek", 3); // This would need a date-based query
        activity.put("averageLoginTime", 45.2); // This would need login tracking
        return activity;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUserReports() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();
        long inactiveUsers = totalUsers - activeUsers;
        
        Map<String, Object> reports = new HashMap<>();
        reports.put("totalUsers", totalUsers);
        reports.put("activeUsers", activeUsers);
        reports.put("inactiveUsers", inactiveUsers);
        reports.put("newUsersThisMonth", 8); // This would need a date-based query
        return reports;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getUsersByRole(String role) {
        try {
            allUsers.UserRole userRole = allUsers.UserRole.valueOf(role.toUpperCase());
            return userRepository.findByUserRole(userRole).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getActiveUsers() {
        return userRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getManagers() {
        return userRepository.findByUserRole(allUsers.UserRole.MANAGER).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO convertToDTO(allUsers user) {
        return UserDTO.builder()
                .id(user.getUserId())
                .username(user.getEmail())
                .name(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .role(String.valueOf(user.getUserRole()))
                .status(user.getIsActive() ? "ACTIVE" : "INACTIVE")
                .avatar(user.getProfilePictureUrl())
                .department(String.valueOf(user.getUserPost()))
                .position(String.valueOf(user.getUserPost()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
} 
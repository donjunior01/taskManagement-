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
        allUsers user = allUsers.builder()
                .email(userDTO.getEmail())
                .firstName(userDTO.getName().split(" ")[0])
                .lastName(userDTO.getName().split(" ").length > 1 ? userDTO.getName().split(" ")[1] : "")
                .userRole(allUsers.UserRole.valueOf(userDTO.getRole()))
                .userPost(allUsers.UserPost.valueOf(userDTO.getDepartment()))
                .profilePictureUrl(userDTO.getAvatar())
                .isActive("ACTIVE".equals(userDTO.getStatus()))
                .build();
        
        allUsers savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    @Override
    public UserDTO updateUser(UserDTO userDTO) {
        return userRepository.findById(userDTO.getId())
                .map(user -> {
                    user.setEmail(userDTO.getEmail());
                    user.setFirstName(userDTO.getName().split(" ")[0]);
                    user.setLastName(userDTO.getName().split(" ").length > 1 ? userDTO.getName().split(" ")[1] : "");
                    user.setUserRole(allUsers.UserRole.valueOf(userDTO.getRole()));
                    user.setUserPost(allUsers.UserPost.valueOf(userDTO.getDepartment()));
                    user.setProfilePictureUrl(userDTO.getAvatar());
                    user.setIsActive("ACTIVE".equals(userDTO.getStatus()));
                    user.setUpdatedAt(LocalDateTime.now());
                    
                    allUsers updatedUser = userRepository.save(user);
                    return convertToDTO(updatedUser);
                })
                .orElse(null);
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
        // Since countByIsActiveTrue doesn't exist, we'll filter from all users
        long activeUsers = userRepository.findAll().stream()
                .filter(allUsers::getIsActive)
                .count();
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
        // Since countByIsActiveTrue doesn't exist, we'll filter from all users
        long activeUsers = userRepository.findAll().stream()
                .filter(allUsers::getIsActive)
                .count();
        long inactiveUsers = totalUsers - activeUsers;
        
        Map<String, Object> reports = new HashMap<>();
        reports.put("totalUsers", totalUsers);
        reports.put("activeUsers", activeUsers);
        reports.put("inactiveUsers", inactiveUsers);
        reports.put("newUsersThisMonth", 8); // This would need a date-based query
        return reports;
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
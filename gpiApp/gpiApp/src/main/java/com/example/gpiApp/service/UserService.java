package com.example.gpiApp.service;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.dto.UserResponseDTO;
import com.example.gpiApp.dto.UserListResponseDTO;
import com.example.gpiApp.entity.allUsers;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserService {
    UserDTO createUser(UserRequestDTO userRequestDTO);
    UserDTO updateUser(UUID userId, UserRequestDTO userRequestDTO);
    void deleteUser(UUID userId);
    Optional<UserDTO> getUserById(UUID userId);
    Optional<UserDTO> getUserByEmail(String email);
    List<UserDTO> getAllUsers();
    List<UserDTO> getActiveUsers();
    List<UserDTO> getUsersByRole(allUsers.UserRole role);
    List<UserDTO> getUsersByPost(allUsers.UserPost post);
    long countActiveUsers();
    long countUsersByRole(allUsers.UserRole role);
    boolean existsByEmail(String email);
    UserResponseDTO authenticateUser(String email, String password);
    void updateUserProfile(UUID userId, UserRequestDTO userRequestDTO);
    void updateUserPassword(UUID userId, String newPassword);
    void deactivateUser(UUID userId);
    void activateUser(UUID userId);
    List<UserDTO> searchUsers(String keyword);
} 
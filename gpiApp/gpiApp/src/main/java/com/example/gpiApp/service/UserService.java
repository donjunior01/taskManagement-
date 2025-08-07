package com.example.gpiApp.service;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.dto.UserResponseDTO;
import com.example.gpiApp.dto.UserListResponseDTO;
import com.example.gpiApp.entity.allUsers;

import java.util.List;
import java.util.Optional;

public interface UserService {
    UserDTO createUser(UserRequestDTO userRequestDTO);
    UserDTO updateUser(Long userId, UserRequestDTO userRequestDTO);
    void deleteUser(Long userId);
    Optional<UserDTO> getUserById(Long userId);
    Optional<UserDTO> getUserByEmail(String email);
    List<UserDTO> getAllUsers();
    List<UserDTO> getActiveUsers();
    List<UserDTO> getUsersByRole(allUsers.UserRole role);
    List<UserDTO> getUsersByPost(allUsers.UserPost post);
    long countActiveUsers();
    long countUsersByRole(allUsers.UserRole role);
    boolean existsByEmail(String email);
    UserResponseDTO authenticateUser(String email, String password);
    void updateUserProfile(Long userId, UserRequestDTO userRequestDTO);
    void updateUserPassword(Long userId, String newPassword);
    void deactivateUser(Long userId);
    void activateUser(Long userId);
    List<UserDTO> searchUsers(String keyword);
} 
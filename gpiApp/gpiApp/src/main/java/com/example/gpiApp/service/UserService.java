package com.example.gpiApp.service;

import com.example.gpiApp.dto.UserDTO;
import java.util.List;
import java.util.Map;

public interface UserService {
    List<UserDTO> getAllUsers();
    UserDTO getUserById(Long id);
    UserDTO getUserByUsername(String username);
    UserDTO createUser(UserDTO userDTO);
    UserDTO updateUser(UserDTO userDTO);
    boolean deleteUser(Long id);
    String getUserRole(String username);
    
    // Dashboard statistics
    Long getTotalUsersCount();
    Map<String, Object> getUserActivityData();
    Map<String, Object> getUserReports();
} 
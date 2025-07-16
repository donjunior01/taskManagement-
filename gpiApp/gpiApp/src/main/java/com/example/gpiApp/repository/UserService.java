package com.example.gpiApp.repository;


import com.example.gpiApp.dto.UserListResponseDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.dto.UserResponseDTO;

public interface UserService {
    UserListResponseDTO getAllUsers(int page, int size, String sortBy, String sortDir);
    UserResponseDTO getUserById(Long id);
    UserResponseDTO createUser(UserRequestDTO userRequestDTO);
    UserResponseDTO updateUser(Long id, UserRequestDTO userRequestDTO);
    UserResponseDTO deleteUser(Long id);
    UserListResponseDTO filterUsers(String role, String status, int page, int size, String sortBy, String sortDir);
} 
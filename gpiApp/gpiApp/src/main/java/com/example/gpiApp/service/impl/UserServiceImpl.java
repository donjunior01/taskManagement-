package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.dto.UserResponseDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDTO createUser(UserRequestDTO userRequestDTO) {
        // Check if email already exists
        if (userRepository.existsByEmail(userRequestDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + userRequestDTO.getEmail());
        }

        allUsers user = allUsers.builder()
                .email(userRequestDTO.getEmail())
                .passwordHash(passwordEncoder.encode(userRequestDTO.getPassword()))
                .firstName(userRequestDTO.getFirstName())
                .lastName(userRequestDTO.getLastName())
                .phone(userRequestDTO.getPhone())
                .profilePictureUrl(userRequestDTO.getProfilePictureUrl())
                .userRole(userRequestDTO.getUserRole())
                .userPost(userRequestDTO.getUserPost())
                .isActive(true)
                .build();

        allUsers savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    @Override
    public UserDTO updateUser(Long userId, UserRequestDTO userRequestDTO) {
        Optional<allUsers> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            allUsers user = userOpt.get();
            
            // Update fields
            user.setEmail(userRequestDTO.getEmail());
            user.setFirstName(userRequestDTO.getFirstName());
            user.setLastName(userRequestDTO.getLastName());
            user.setPhone(userRequestDTO.getPhone());
            user.setProfilePictureUrl(userRequestDTO.getProfilePictureUrl());
            user.setUserRole(userRequestDTO.getUserRole());
            user.setUserPost(userRequestDTO.getUserPost());
            
            // Update password if provided
            if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isEmpty()) {
                user.setPasswordHash(passwordEncoder.encode(userRequestDTO.getPassword()));
            }
            
            user.setUpdatedAt(LocalDateTime.now());
            allUsers updatedUser = userRepository.save(user);
            return convertToDTO(updatedUser);
        }
        throw new RuntimeException("User not found with ID: " + userId);
    }

    @Override
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with ID: " + userId);
        }
        userRepository.deleteById(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDTO> getUserById(Long userId) {
        return userRepository.findById(userId).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDTO> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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
    public List<UserDTO> getUsersByRole(allUsers.UserRole role) {
        return userRepository.findByUserRole(role).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getUsersByPost(allUsers.UserPost post) {
        return userRepository.findByUserPost(post).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveUsers() {
        return userRepository.countByIsActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public long countUsersByRole(allUsers.UserRole role) {
        return userRepository.countByUserRole(role);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public UserResponseDTO authenticateUser(String email, String password) {
        Optional<allUsers> userOpt = userRepository.findByEmailAndIsActiveTrue(email);
        if (userOpt.isPresent()) {
            allUsers user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPasswordHash())) {
                // Update last login
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
                
                UserDTO userDTO = convertToDTO(user);
                return new UserResponseDTO(true, "Authentication successful", userDTO);
            }
        }
        return new UserResponseDTO(false, "Invalid email or password", null);
    }

    @Override
    public void updateUserProfile(Long userId, UserRequestDTO userRequestDTO) {
        Optional<allUsers> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            allUsers user = userOpt.get();
            
            // Update profile fields only
            user.setFirstName(userRequestDTO.getFirstName());
            user.setLastName(userRequestDTO.getLastName());
            user.setPhone(userRequestDTO.getPhone());
            user.setProfilePictureUrl(userRequestDTO.getProfilePictureUrl());
            user.setUpdatedAt(LocalDateTime.now());
            
            userRepository.save(user);
        } else {
            throw new RuntimeException("User not found with ID: " + userId);
        }
    }

    @Override
    public void updateUserPassword(Long userId, String newPassword) {
        Optional<allUsers> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            allUsers user = userOpt.get();
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } else {
            throw new RuntimeException("User not found with ID: " + userId);
        }
    }

    @Override
    public void deactivateUser(Long userId) {
        Optional<allUsers> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            allUsers user = userOpt.get();
            user.setIsActive(false);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } else {
            throw new RuntimeException("User not found with ID: " + userId);
        }
    }

    @Override
    public void activateUser(Long userId) {
        Optional<allUsers> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            allUsers user = userOpt.get();
            user.setIsActive(true);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } else {
            throw new RuntimeException("User not found with ID: " + userId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> searchUsers(String keyword) {
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                keyword, keyword, keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO convertToDTO(allUsers user) {
        return UserDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .profilePictureUrl(user.getProfilePictureUrl())
                .userRole(user.getUserRole())
                .userPost(user.getUserPost())
                .isActive(user.getIsActive())
                .emailVerifiedAt(user.getEmailVerifiedAt())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
} 
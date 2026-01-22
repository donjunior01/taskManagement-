package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.UserListResponseDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.dto.UserResponseDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.entity.allUsers.Role;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
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
            System.out.println("Saving allUsers: " + allUsers);
            allUsers savedAllUsers = userRepository.save(allUsers);
            System.out.println("allUsers saved successfully with ID: " + savedAllUsers.getId());
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
                existingAllUsers.setRole(allUsers.Role.valueOf(userRequestDTO.getRole().toString()));
            }
            
            // Only update password if a new one is provided
            if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isEmpty()) {
                System.out.println("Updating password for user ID: " + id);
                existingAllUsers.setPassword(passwordEncoder.encode(userRequestDTO.getPassword()));
            }

            System.out.println("Saving updated user: " + existingAllUsers);
            allUsers updatedAllUsers = userRepository.save(existingAllUsers);
            System.out.println("allUsers saved successfully: " + updatedAllUsers);

            UserDTO userDTO = convertToDTO(updatedAllUsers);
            return new UserResponseDTO(true, "allUsers updated successfully", userDTO);
        } catch (Exception e) {
            System.out.println("Error updating user: " + e.getMessage());
            e.printStackTrace();
            return new UserResponseDTO(false, "Error updating user: " + e.getMessage(), null);
        }
    }

    @Override
    public UserResponseDTO deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            return new UserResponseDTO(false, "allUsers not found", null);
        }
        userRepository.deleteById(id);
        return new UserResponseDTO(true, "allUsers deleted successfully", null);
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
    public void changePassword(String email, String currentPassword, String newPassword) {
        allUsers user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
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
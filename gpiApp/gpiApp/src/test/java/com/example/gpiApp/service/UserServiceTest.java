package com.example.gpiApp.service;

import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.dto.UserRequestDTO;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private UserRequestDTO userRequestDTO;
    private allUsers testUser;

    @BeforeEach
    void setUp() {
        userRequestDTO = new UserRequestDTO();
        userRequestDTO.setEmail("test@example.com");
        userRequestDTO.setPassword("password123");
        userRequestDTO.setFirstName("John");
        userRequestDTO.setLastName("Doe");
        userRequestDTO.setUserRole(allUsers.UserRole.EMPLOYEE);
        userRequestDTO.setUserPost(allUsers.UserPost.DEVELOPER);

        testUser = allUsers.builder()
                .userId(UUID.randomUUID())
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .userRole(allUsers.UserRole.EMPLOYEE)
                .userPost(allUsers.UserPost.DEVELOPER)
                .isActive(true)
                .build();
    }

    @Test
    void testCreateUser_Success() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(allUsers.class))).thenReturn(testUser);

        // When
        UserDTO result = userService.createUser(userRequestDTO);

        // Then
        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        assertEquals("John", result.getFirstName());
        assertEquals("Doe", result.getLastName());
        assertEquals(allUsers.UserRole.EMPLOYEE, result.getUserRole());
        
        verify(userRepository).existsByEmail("test@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(allUsers.class));
    }

    @Test
    void testCreateUser_EmailAlreadyExists() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            userService.createUser(userRequestDTO);
        });
        
        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository, never()).save(any(allUsers.class));
    }

    @Test
    void testGetUserByEmail_Success() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<UserDTO> result = userService.getUserByEmail("test@example.com");

        // Then
        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
        assertEquals("John", result.get().getFirstName());
        
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void testGetUserByEmail_NotFound() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        Optional<UserDTO> result = userService.getUserByEmail("nonexistent@example.com");

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    void testExistsByEmail_True() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When
        boolean result = userService.existsByEmail("test@example.com");

        // Then
        assertTrue(result);
        verify(userRepository).existsByEmail("test@example.com");
    }

    @Test
    void testExistsByEmail_False() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);

        // When
        boolean result = userService.existsByEmail("test@example.com");

        // Then
        assertFalse(result);
        verify(userRepository).existsByEmail("test@example.com");
    }
} 
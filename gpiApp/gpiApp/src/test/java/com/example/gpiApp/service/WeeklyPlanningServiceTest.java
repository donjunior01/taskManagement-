package com.example.gpiApp.service;

import com.example.gpiApp.dto.WeeklyPlanningDTO;
import com.example.gpiApp.entity.WeeklyPlanning;
import com.example.gpiApp.repository.WeeklyPlanningRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.impl.WeeklyPlanningServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WeeklyPlanningServiceTest {

    @Mock
    private WeeklyPlanningRepository weeklyPlanningRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WeeklyPlanningServiceImpl weeklyPlanningService;

    private WeeklyPlanningDTO testPlanningDTO;
    private WeeklyPlanning testPlanning;
    private UUID testUserId;
    private UUID testPlanningId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        testUserId = UUID.randomUUID();
        testPlanningId = UUID.randomUUID();
        
        testPlanningDTO = WeeklyPlanningDTO.builder()
                .userId(testUserId)
                .weekNumber(1)
                .year(2024)
                .weekStartDate(LocalDate.of(2024, 1, 1))
                .weekEndDate(LocalDate.of(2024, 1, 7))
                .totalTasksPlanned(5)
                .build();
        
        testPlanning = WeeklyPlanning.builder()
                .planningId(testPlanningId)
                .weekNumber(1)
                .year(2024)
                .weekStartDate(LocalDate.of(2024, 1, 1))
                .weekEndDate(LocalDate.of(2024, 1, 7))
                .complianceStatus(WeeklyPlanning.ComplianceStatus.NON_COMPLIANT)
                .totalTasksPlanned(5)
                .isApproved(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testCreateWeeklyPlanning() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(mock(allUsers.class)));
        when(weeklyPlanningRepository.save(any(WeeklyPlanning.class))).thenReturn(testPlanning);

        // When
        WeeklyPlanningDTO result = weeklyPlanningService.createWeeklyPlanning(testPlanningDTO);

        // Then
        assertNotNull(result);
        assertEquals(testPlanningId, result.getPlanningId());
        assertEquals(testUserId, result.getUserId());
        assertEquals(1, result.getWeekNumber());
        assertEquals(2024, result.getYear());
        assertEquals(5, result.getTotalTasksPlanned());
        assertFalse(result.getIsApproved());
    }

    @Test
    void testGetWeeklyPlanningById() {
        // Given
        when(weeklyPlanningRepository.findById(testPlanningId)).thenReturn(Optional.of(testPlanning));

        // When
        Optional<WeeklyPlanningDTO> result = weeklyPlanningService.getWeeklyPlanningById(testPlanningId);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testPlanningId, result.get().getPlanningId());
    }

    @Test
    void testSubmitWeeklyPlanning() {
        // Given
        when(weeklyPlanningRepository.findById(testPlanningId)).thenReturn(Optional.of(testPlanning));
        when(weeklyPlanningRepository.save(any(WeeklyPlanning.class))).thenReturn(testPlanning);

        // When
        WeeklyPlanningDTO result = weeklyPlanningService.submitWeeklyPlanning(testPlanningId);

        // Then
        assertNotNull(result);
        assertEquals(WeeklyPlanning.ComplianceStatus.NON_COMPLIANT, result.getComplianceStatus());
        assertNotNull(result.getSubmittedAt());
    }

    @Test
    void testCalculateComplianceStatus() {
        // Given
        testPlanning.setTotalTasksPlanned(10);
        when(weeklyPlanningRepository.findById(testPlanningId)).thenReturn(Optional.of(testPlanning));
        when(weeklyPlanningRepository.save(any(WeeklyPlanning.class))).thenReturn(testPlanning);

        // When
        WeeklyPlanningDTO result = weeklyPlanningService.calculateComplianceStatus(testPlanningId);

        // Then
        assertNotNull(result);
        assertEquals(WeeklyPlanning.ComplianceStatus.COMPLIANT, result.getComplianceStatus());
    }
} 
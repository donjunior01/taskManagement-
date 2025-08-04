package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.WeeklyPlanningDTO;
import com.example.gpiApp.entity.WeeklyPlanning;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.WeeklyPlanningRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.WeeklyPlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WeeklyPlanningServiceImpl implements WeeklyPlanningService {
    
    private final WeeklyPlanningRepository weeklyPlanningRepository;
    private final UserRepository userRepository;
    
    @Override
    public WeeklyPlanningDTO createWeeklyPlanning(WeeklyPlanningDTO weeklyPlanningDTO) {
        allUsers user = userRepository.findById(weeklyPlanningDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        WeeklyPlanning planning = WeeklyPlanning.builder()
                .user(user)
                .weekNumber(weeklyPlanningDTO.getWeekNumber())
                .year(weeklyPlanningDTO.getYear())
                .weekStartDate(weeklyPlanningDTO.getWeekStartDate())
                .weekEndDate(weeklyPlanningDTO.getWeekEndDate())
                .complianceStatus(WeeklyPlanning.ComplianceStatus.NON_COMPLIANT)
                .totalTasksPlanned(weeklyPlanningDTO.getTotalTasksPlanned())
                .isApproved(false)
                .build();
        
        WeeklyPlanning savedPlanning = weeklyPlanningRepository.save(planning);
        return convertToDTO(savedPlanning);
    }
    
    @Override
    public WeeklyPlanningDTO updateWeeklyPlanning(UUID planningId, WeeklyPlanningDTO weeklyPlanningDTO) {
        Optional<WeeklyPlanning> planningOpt = weeklyPlanningRepository.findById(planningId);
        if (planningOpt.isPresent()) {
            WeeklyPlanning planning = planningOpt.get();
            planning.setWeekNumber(weeklyPlanningDTO.getWeekNumber());
            planning.setYear(weeklyPlanningDTO.getYear());
            planning.setWeekStartDate(weeklyPlanningDTO.getWeekStartDate());
            planning.setWeekEndDate(weeklyPlanningDTO.getWeekEndDate());
            planning.setTotalTasksPlanned(weeklyPlanningDTO.getTotalTasksPlanned());
            
            WeeklyPlanning updatedPlanning = weeklyPlanningRepository.save(planning);
            return convertToDTO(updatedPlanning);
        }
        throw new RuntimeException("Weekly Planning not found");
    }
    
    @Override
    public void deleteWeeklyPlanning(UUID planningId) {
        weeklyPlanningRepository.deleteById(planningId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<WeeklyPlanningDTO> getWeeklyPlanningById(UUID planningId) {
        return weeklyPlanningRepository.findById(planningId).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getAllWeeklyPlannings() {
        return weeklyPlanningRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getWeeklyPlanningsByUser(UUID userId) {
        return weeklyPlanningRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<WeeklyPlanningDTO> getWeeklyPlanningByUserAndWeek(UUID userId, Integer weekNumber, Integer year) {
        return weeklyPlanningRepository.findByUserAndWeek(userId, weekNumber, year)
                .map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getWeeklyPlanningsForDate(LocalDate date) {
        return weeklyPlanningRepository.findPlanningsForDate(date).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getWeeklyPlanningsByComplianceStatus(WeeklyPlanning.ComplianceStatus status) {
        return weeklyPlanningRepository.findByComplianceStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getPendingApprovals() {
        return weeklyPlanningRepository.findPendingApprovals().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getApprovedPlanningsByUser(UUID userId) {
        return weeklyPlanningRepository.findApprovedPlanningsByUser(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<WeeklyPlanningDTO> getCurrentWeeklyPlanning() {
        LocalDate now = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int currentWeek = now.get(weekFields.weekOfWeekBasedYear());
        int currentYear = now.getYear();
        
        // For now, return the first planning for current week/year
        // In a real application, you might want to get the current user's planning
        return weeklyPlanningRepository.findByWeekAndYear(currentWeek, currentYear)
                .stream()
                .findFirst()
                .map(this::convertToDTO);
    }
    
    @Override
    public WeeklyPlanningDTO submitWeeklyPlanning(UUID planningId) {
        Optional<WeeklyPlanning> planningOpt = weeklyPlanningRepository.findById(planningId);
        if (planningOpt.isPresent()) {
            WeeklyPlanning planning = planningOpt.get();
            planning.setComplianceStatus(WeeklyPlanning.ComplianceStatus.NON_COMPLIANT);
            planning.setSubmittedAt(LocalDateTime.now());
            
            WeeklyPlanning updatedPlanning = weeklyPlanningRepository.save(planning);
            return convertToDTO(updatedPlanning);
        }
        throw new RuntimeException("Weekly Planning not found");
    }
    
    @Override
    public WeeklyPlanningDTO approveWeeklyPlanning(UUID planningId, UUID approverId) {
        Optional<WeeklyPlanning> planningOpt = weeklyPlanningRepository.findById(planningId);
        Optional<allUsers> approverOpt = userRepository.findById(approverId);
        
        if (planningOpt.isPresent() && approverOpt.isPresent()) {
            WeeklyPlanning planning = planningOpt.get();
            allUsers approver = approverOpt.get();
            
            planning.setIsApproved(true);
            planning.setApprovedBy(approver);
            planning.setApprovedAt(LocalDateTime.now());
            
            WeeklyPlanning updatedPlanning = weeklyPlanningRepository.save(planning);
            return convertToDTO(updatedPlanning);
        }
        throw new RuntimeException("Weekly Planning or Approver not found");
    }
    
    @Override
    public WeeklyPlanningDTO rejectWeeklyPlanning(UUID planningId, UUID approverId, String reason) {
        Optional<WeeklyPlanning> planningOpt = weeklyPlanningRepository.findById(planningId);
        Optional<allUsers> approverOpt = userRepository.findById(approverId);
        
        if (planningOpt.isPresent() && approverOpt.isPresent()) {
            WeeklyPlanning planning = planningOpt.get();
            allUsers approver = approverOpt.get();
            
            planning.setIsApproved(false);
            planning.setApprovedBy(approver);
            planning.setApprovedAt(LocalDateTime.now());
            
            WeeklyPlanning updatedPlanning = weeklyPlanningRepository.save(planning);
            return convertToDTO(updatedPlanning);
        }
        throw new RuntimeException("Weekly Planning or Approver not found");
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countCompliantPlanningsByUser(UUID userId) {
        return weeklyPlanningRepository.countCompliantPlanningsByUser(userId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getWeeklyPlanningsInDateRange(LocalDate startDate, LocalDate endDate) {
        return weeklyPlanningRepository.findPlanningsInDateRange(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public WeeklyPlanningDTO calculateComplianceStatus(UUID planningId) {
        Optional<WeeklyPlanning> planningOpt = weeklyPlanningRepository.findById(planningId);
        if (planningOpt.isPresent()) {
            WeeklyPlanning planning = planningOpt.get();
            
            // Simple compliance calculation based on total tasks planned
            if (planning.getTotalTasksPlanned() > 0) {
                planning.setComplianceStatus(WeeklyPlanning.ComplianceStatus.COMPLIANT);
            } else {
                planning.setComplianceStatus(WeeklyPlanning.ComplianceStatus.NON_COMPLIANT);
            }
            
            WeeklyPlanning updatedPlanning = weeklyPlanningRepository.save(planning);
            return convertToDTO(updatedPlanning);
        }
        throw new RuntimeException("Weekly Planning not found");
    }
    
    private WeeklyPlanningDTO convertToDTO(WeeklyPlanning planning) {
        return WeeklyPlanningDTO.builder()
                .planningId(planning.getPlanningId())
                .userId(planning.getUser().getUserId())
                .weekNumber(planning.getWeekNumber())
                .year(planning.getYear())
                .weekStartDate(planning.getWeekStartDate())
                .weekEndDate(planning.getWeekEndDate())
                .complianceStatus(planning.getComplianceStatus())
                .totalTasksPlanned(planning.getTotalTasksPlanned())
                .submittedAt(planning.getSubmittedAt())
                .isApproved(planning.getIsApproved())
                .approvedById(planning.getApprovedBy() != null ? planning.getApprovedBy().getUserId() : null)
                .approvedAt(planning.getApprovedAt())
                .createdAt(planning.getCreatedAt())
                .updatedAt(planning.getUpdatedAt())
                .build();
    }
} 
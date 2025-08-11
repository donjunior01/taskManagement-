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
    public WeeklyPlanningDTO updateWeeklyPlanning(Long planningId, WeeklyPlanningDTO weeklyPlanningDTO) {
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
    public void deleteWeeklyPlanning(Long planningId) {
        weeklyPlanningRepository.deleteById(planningId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<WeeklyPlanningDTO> getWeeklyPlanningById(Long planningId) {
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
    public List<WeeklyPlanningDTO> getWeeklyPlanningsByUser(Long userId) {
        return weeklyPlanningRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<WeeklyPlanningDTO> getWeeklyPlanningByUserAndWeek(Long userId, Integer weekNumber, Integer year) {
        return weeklyPlanningRepository.findByUserAndWeek(userId, weekNumber, year)
                .map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getWeeklyPlanningsByStatus(WeeklyPlanningDTO.ComplianceStatus status) {
        WeeklyPlanning.ComplianceStatus entityStatus = WeeklyPlanning.ComplianceStatus.valueOf(status.name());
        return weeklyPlanningRepository.findByComplianceStatus(entityStatus).stream()
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
    public List<WeeklyPlanningDTO> getApprovedPlanningsByUser(Long userId) {
        return weeklyPlanningRepository.findApprovedPlanningsByUser(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WeeklyPlanningDTO> getCompliantPlanningsByUser(Long userId) {
        return weeklyPlanningRepository.findCompliantPlanningsByUser(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public WeeklyPlanningDTO submitWeeklyPlanning(Long planningId) {
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
    public WeeklyPlanningDTO approveWeeklyPlanning(Long planningId, Long approverId) {
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
    public WeeklyPlanningDTO rejectWeeklyPlanning(Long planningId, Long approverId, String reason) {
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
    public long countPlanningsByUser(Long userId) {
        return weeklyPlanningRepository.findByUserId(userId).size();
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countCompliantPlanningsByUser(Long userId) {
        return weeklyPlanningRepository.countCompliantPlanningsByUser(userId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public double calculateComplianceRate(Long userId) {
        long totalPlannings = countPlanningsByUser(userId);
        long compliantPlannings = countCompliantPlanningsByUser(userId);
        
        if (totalPlannings == 0) {
            return 0.0;
        }
        
        return (double) compliantPlannings / totalPlannings * 100.0;
    }
    
    @Override
    public WeeklyPlanningDTO calculateComplianceStatus(Long planningId) {
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
                .complianceStatus(WeeklyPlanningDTO.ComplianceStatus.valueOf(planning.getComplianceStatus().name()))
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
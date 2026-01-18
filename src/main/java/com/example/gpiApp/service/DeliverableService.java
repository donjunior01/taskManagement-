package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.Deliverable;
import com.example.gpiApp.repository.DeliverableRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliverableService {
    
    private final DeliverableRepository deliverableRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    
    @Transactional(readOnly = true)
    public PagedResponse<DeliverableDTO> getAllDeliverables(int page, int size) {
        try {
            PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Deliverable> deliverablePage = deliverableRepository.findAll(pageable);
            
            List<DeliverableDTO> deliverableDTOs = deliverablePage.getContent().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            return PagedResponse.of(deliverableDTOs, deliverablePage.getNumber(), deliverablePage.getSize(),
                    deliverablePage.getTotalElements(), deliverablePage.getTotalPages(),
                    deliverablePage.isFirst(), deliverablePage.isLast());
        } catch (Exception e) {
            // Log the error and return empty response
            e.printStackTrace();
            return PagedResponse.of(List.of(), page, size, 0, 0, true, true);
        }
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<DeliverableDTO> getDeliverableById(Long id) {
        return deliverableRepository.findById(id)
                .map(deliverable -> ApiResponse.success("Deliverable retrieved successfully", convertToDTO(deliverable)))
                .orElse(ApiResponse.error("Deliverable not found"));
    }
    
    @Transactional
    public ApiResponse<DeliverableDTO> createDeliverable(DeliverableRequestDTO request, Long userId) {
        Deliverable deliverable = new Deliverable();
        deliverable.setFileName(request.getFileName());
        deliverable.setFileUrl(request.getFileUrl());
        deliverable.setFileSize(request.getFileSize());
        deliverable.setStatus(Deliverable.DeliverableStatus.PENDING);
        
        taskRepository.findById(request.getTaskId())
                .ifPresent(deliverable::setTask);
        
        userRepository.findById(userId)
                .ifPresent(deliverable::setSubmittedBy);
        
        Deliverable savedDeliverable = deliverableRepository.save(deliverable);
        
        // Log activity
        userRepository.findById(userId).ifPresent(user -> 
            activityLogService.logActivity(
                ActivityLog.ActivityType.DELIVERABLE_SUBMITTED,
                "Deliverable '" + savedDeliverable.getFileName() + "' was submitted",
                user,
                "DELIVERABLE",
                savedDeliverable.getId(),
                null
            )
        );
        
        return ApiResponse.success("Deliverable submitted successfully", convertToDTO(savedDeliverable));
    }
    
    @Transactional
    public ApiResponse<DeliverableDTO> reviewDeliverable(Long id, DeliverableReviewDTO request, Long reviewerId) {
        return deliverableRepository.findById(id)
                .map(deliverable -> {
                    deliverable.setStatus(request.getStatus());
                    deliverable.setComments(request.getComments());
                    deliverable.setReviewedAt(LocalDateTime.now());
                    
                    userRepository.findById(reviewerId)
                            .ifPresent(deliverable::setReviewedBy);
                    
                    Deliverable updatedDeliverable = deliverableRepository.save(deliverable);
                    
                    // Log activity
                    userRepository.findById(reviewerId).ifPresent(user -> 
                        activityLogService.logActivity(
                            ActivityLog.ActivityType.DELIVERABLE_REVIEWED,
                            "Deliverable '" + updatedDeliverable.getFileName() + "' was " + request.getStatus().toString().toLowerCase(),
                            user,
                            "DELIVERABLE",
                            updatedDeliverable.getId(),
                            null
                        )
                    );
                    
                    return ApiResponse.success("Deliverable reviewed successfully", convertToDTO(updatedDeliverable));
                })
                .orElse(ApiResponse.error("Deliverable not found"));
    }
    
    @Transactional
    public ApiResponse<Void> deleteDeliverable(Long id) {
        return deliverableRepository.findById(id)
                .map(deliverable -> {
                    deliverableRepository.delete(deliverable);
                    return ApiResponse.<Void>success("Deliverable deleted successfully", null);
                })
                .orElse(ApiResponse.error("Deliverable not found"));
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<DeliverableDTO> getDeliverablesByTask(Long taskId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Deliverable> deliverablePage = deliverableRepository.findByTaskId(taskId, pageable);
        
        List<DeliverableDTO> deliverableDTOs = deliverablePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(deliverableDTOs, deliverablePage.getNumber(), deliverablePage.getSize(),
                deliverablePage.getTotalElements(), deliverablePage.getTotalPages(),
                deliverablePage.isFirst(), deliverablePage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<DeliverableDTO> getDeliverablesByUser(Long userId, int page, int size) {
        try {
            PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Deliverable> deliverablePage = deliverableRepository.findBySubmittedById(userId, pageable);
            
            List<DeliverableDTO> deliverableDTOs = deliverablePage.getContent().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            return PagedResponse.of(deliverableDTOs, deliverablePage.getNumber(), deliverablePage.getSize(),
                    deliverablePage.getTotalElements(), deliverablePage.getTotalPages(),
                    deliverablePage.isFirst(), deliverablePage.isLast());
        } catch (Exception e) {
            // Log the error and return empty response
            e.printStackTrace();
            return PagedResponse.of(List.of(), page, size, 0, 0, true, true);
        }
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<DeliverableDTO> getDeliverablesByStatus(Deliverable.DeliverableStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Deliverable> deliverablePage = deliverableRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        
        List<DeliverableDTO> deliverableDTOs = deliverablePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(deliverableDTOs, deliverablePage.getNumber(), deliverablePage.getSize(),
                deliverablePage.getTotalElements(), deliverablePage.getTotalPages(),
                deliverablePage.isFirst(), deliverablePage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<DeliverableDTO> getPendingDeliverablesByManager(Long managerId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Deliverable> deliverablePage = deliverableRepository.findByProjectManagerIdAndStatus(
                managerId, Deliverable.DeliverableStatus.PENDING, pageable);
        
        List<DeliverableDTO> deliverableDTOs = deliverablePage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(deliverableDTOs, deliverablePage.getNumber(), deliverablePage.getSize(),
                deliverablePage.getTotalElements(), deliverablePage.getTotalPages(),
                deliverablePage.isFirst(), deliverablePage.isLast());
    }
    
    private DeliverableDTO convertToDTO(Deliverable deliverable) {
        try {
            return DeliverableDTO.builder()
                    .id(deliverable.getId())
                    .taskId(getTaskId(deliverable))
                    .taskName(getTaskName(deliverable))
                    .submittedById(getSubmittedById(deliverable))
                    .submittedByName(getSubmittedByName(deliverable))
                    .fileName(deliverable.getFileName())
                    .fileUrl(deliverable.getFileUrl())
                    .fileSize(deliverable.getFileSize())
                    .status(deliverable.getStatus())
                    .comments(deliverable.getComments())
                    .reviewedById(getReviewedById(deliverable))
                    .reviewedByName(getReviewedByName(deliverable))
                    .reviewedAt(deliverable.getReviewedAt())
                    .createdAt(deliverable.getCreatedAt())
                    .updatedAt(deliverable.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            // Return a minimal DTO if there's an issue with lazy loading
            return DeliverableDTO.builder()
                    .id(deliverable.getId())
                    .fileName(deliverable.getFileName())
                    .fileUrl(deliverable.getFileUrl())
                    .status(deliverable.getStatus())
                    .createdAt(deliverable.getCreatedAt())
                    .build();
        }
    }
    
    private Long getTaskId(Deliverable deliverable) {
        try {
            return deliverable.getTask() != null ? deliverable.getTask().getId() : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getTaskName(Deliverable deliverable) {
        try {
            return deliverable.getTask() != null ? deliverable.getTask().getName() : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private Long getSubmittedById(Deliverable deliverable) {
        try {
            return deliverable.getSubmittedBy() != null ? deliverable.getSubmittedBy().getId() : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getSubmittedByName(Deliverable deliverable) {
        try {
            if (deliverable.getSubmittedBy() != null) {
                return deliverable.getSubmittedBy().getFirstName() + " " + deliverable.getSubmittedBy().getLastName();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private Long getReviewedById(Deliverable deliverable) {
        try {
            return deliverable.getReviewedBy() != null ? deliverable.getReviewedBy().getId() : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    private String getReviewedByName(Deliverable deliverable) {
        try {
            if (deliverable.getReviewedBy() != null) {
                return deliverable.getReviewedBy().getFirstName() + " " + deliverable.getReviewedBy().getLastName();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}


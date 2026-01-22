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
            Page<Deliverable> deliverablePage = deliverableRepository.findAllWithDetails(pageable);
            
            List<DeliverableDTO> deliverableDTOs = deliverablePage.getContent().stream()
                    .map(this::convertToDTOSafe)
                    .collect(Collectors.toList());
            
            return PagedResponse.of(deliverableDTOs, deliverablePage.getNumber(), deliverablePage.getSize(),
                    deliverablePage.getTotalElements(), deliverablePage.getTotalPages(),
                    deliverablePage.isFirst(), deliverablePage.isLast());
        } catch (Exception e) {
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
        try {
            if (request.getTaskId() == null) {
                return ApiResponse.error("Task ID is required");
            }
            if (userId == null) {
                return ApiResponse.error("User ID is required");
            }
            
            var task = taskRepository.findById(request.getTaskId())
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + request.getTaskId()));
            
            var user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            
            Deliverable deliverable = Deliverable.builder()
                    .fileName(request.getFileName())
                    .fileUrl(request.getFileUrl())
                    .fileSize(request.getFileSize())
                    .status(Deliverable.DeliverableStatus.PENDING)
                    .task(task)
                    .submittedBy(user)
                    .build();
            
            Deliverable savedDeliverable = deliverableRepository.save(deliverable);
            
            // Log activity
            activityLogService.logActivity(
                ActivityLog.ActivityType.DELIVERABLE_SUBMITTED,
                "Deliverable '" + savedDeliverable.getFileName() + "' was submitted for task '" + task.getName() + "'",
                user,
                "DELIVERABLE",
                savedDeliverable.getId(),
                null
            );
            
            return ApiResponse.success("Deliverable submitted successfully", convertToDTOSafe(savedDeliverable));
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("Failed to create deliverable: " + e.getMessage());
        }
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
            if (userId == null) {
                return PagedResponse.of(List.of(), page, size, 0, 0, true, true);
            }
            
            PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Deliverable> deliverablePage = deliverableRepository.findBySubmittedById(userId, pageable);
            
            List<DeliverableDTO> deliverableDTOs = deliverablePage.getContent().stream()
                    .map(this::convertToDTOSafe)
                    .collect(Collectors.toList());
            
            return PagedResponse.of(deliverableDTOs, deliverablePage.getNumber(), deliverablePage.getSize(),
                    deliverablePage.getTotalElements(), deliverablePage.getTotalPages(),
                    deliverablePage.isFirst(), deliverablePage.isLast());
        } catch (Exception e) {
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
        return DeliverableDTO.builder()
                .id(deliverable.getId())
                .taskId(deliverable.getTask() != null ? deliverable.getTask().getId() : null)
                .taskName(deliverable.getTask() != null ? deliverable.getTask().getName() : null)
                .submittedById(deliverable.getSubmittedBy() != null ? deliverable.getSubmittedBy().getId() : null)
                .submittedByName(deliverable.getSubmittedBy() != null ? 
                    deliverable.getSubmittedBy().getFirstName() + " " + deliverable.getSubmittedBy().getLastName() : null)
                .fileName(deliverable.getFileName())
                .fileUrl(deliverable.getFileUrl())
                .fileSize(deliverable.getFileSize())
                .status(deliverable.getStatus())
                .comments(deliverable.getComments())
                .reviewedById(deliverable.getReviewedBy() != null ? deliverable.getReviewedBy().getId() : null)
                .reviewedByName(deliverable.getReviewedBy() != null ? 
                    deliverable.getReviewedBy().getFirstName() + " " + deliverable.getReviewedBy().getLastName() : null)
                .reviewedAt(deliverable.getReviewedAt())
                .createdAt(deliverable.getCreatedAt())
                .updatedAt(deliverable.getUpdatedAt())
                .build();
    }
    
    private DeliverableDTO convertToDTOSafe(Deliverable deliverable) {
        try {
            return convertToDTO(deliverable);
        } catch (Exception e) {
            return DeliverableDTO.builder()
                    .id(deliverable.getId())
                    .fileName(deliverable.getFileName())
                    .fileUrl(deliverable.getFileUrl())
                    .fileSize(deliverable.getFileSize())
                    .status(deliverable.getStatus())
                    .comments(deliverable.getComments())
                    .createdAt(deliverable.getCreatedAt())
                    .updatedAt(deliverable.getUpdatedAt())
                    .build();
        }
    }
}


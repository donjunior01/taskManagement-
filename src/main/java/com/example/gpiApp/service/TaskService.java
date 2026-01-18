package com.example.gpiApp.service;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final TimeLogRepository timeLogRepository;
    private final ActivityLogService activityLogService;
    private final CalendarService calendarService;
    
    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       CommentRepository commentRepository,
                       TimeLogRepository timeLogRepository,
                       ActivityLogService activityLogService,
                       @Lazy CalendarService calendarService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.timeLogRepository = timeLogRepository;
        this.activityLogService = activityLogService;
        this.calendarService = calendarService;
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<TaskDTO> getAllTasks(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, size, sort);
        Page<Task> taskPage = taskRepository.findAll(pageable);
        
        List<TaskDTO> taskDTOs = taskPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(taskDTOs, taskPage.getNumber(), taskPage.getSize(),
                taskPage.getTotalElements(), taskPage.getTotalPages(),
                taskPage.isFirst(), taskPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public ApiResponse<TaskDTO> getTaskById(Long id) {
        return taskRepository.findById(id)
                .map(task -> ApiResponse.success("Task retrieved successfully", convertToDTO(task)))
                .orElse(ApiResponse.error("Task not found"));
    }
    
    @Transactional
    public ApiResponse<TaskDTO> createTask(TaskRequestDTO request, Long createdById) {
        Task task = new Task();
        task.setName(request.getName());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority() != null ? request.getPriority() : Task.TaskPriority.MEDIUM);
        task.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : Task.TaskDifficulty.MEDIUM);
        task.setStatus(request.getStatus() != null ? request.getStatus() : Task.TaskStatus.TODO);
        task.setProgress(request.getProgress() != null ? request.getProgress() : 0);
        task.setDeadline(request.getDeadline());
        task.setReminderType(request.getReminderType());
        
        if (request.getProjectId() != null) {
            projectRepository.findById(request.getProjectId())
                    .ifPresent(task::setProject);
        }
        
        if (request.getAssignedToId() != null) {
            userRepository.findById(request.getAssignedToId())
                    .ifPresent(task::setAssignedTo);
        }
        
        userRepository.findById(createdById).ifPresent(task::setCreatedBy);
        
        Task savedTask = taskRepository.save(task);
        
        // Log activity
        userRepository.findById(createdById).ifPresent(user -> 
            activityLogService.logActivity(
                ActivityLog.ActivityType.TASK_CREATED,
                "Task '" + savedTask.getName() + "' was created",
                user,
                "TASK",
                savedTask.getId(),
                null
            )
        );
        
        // Create calendar event for task deadline
        try {
            calendarService.createTaskCalendarEvent(savedTask, createdById);
        } catch (Exception e) {
            System.err.println("Failed to create calendar event for task: " + e.getMessage());
        }
        
        return ApiResponse.success("Task created successfully", convertToDTO(savedTask));
    }
    
    @Transactional
    public ApiResponse<TaskDTO> updateTask(Long id, TaskRequestDTO request, Long updatedById) {
        return taskRepository.findById(id)
                .map(task -> {
                    task.setName(request.getName());
                    task.setDescription(request.getDescription());
                    if (request.getPriority() != null) task.setPriority(request.getPriority());
                    if (request.getDifficulty() != null) task.setDifficulty(request.getDifficulty());
                    if (request.getStatus() != null) task.setStatus(request.getStatus());
                    if (request.getProgress() != null) task.setProgress(request.getProgress());
                    task.setDeadline(request.getDeadline());
                    task.setReminderType(request.getReminderType());
                    
                    if (request.getProjectId() != null) {
                        projectRepository.findById(request.getProjectId())
                                .ifPresent(task::setProject);
                    }
                    
                    if (request.getAssignedToId() != null) {
                        userRepository.findById(request.getAssignedToId())
                                .ifPresent(task::setAssignedTo);
                    }
                    
                    Task updatedTask = taskRepository.save(task);
                    
                    // Log activity
                    userRepository.findById(updatedById).ifPresent(user -> 
                        activityLogService.logActivity(
                            ActivityLog.ActivityType.TASK_UPDATED,
                            "Task '" + updatedTask.getName() + "' was updated",
                            user,
                            "TASK",
                            updatedTask.getId(),
                            null
                        )
                    );
                    
                    // Update calendar event for task deadline
                    try {
                        calendarService.updateTaskCalendarEvent(updatedTask);
                    } catch (Exception e) {
                        System.err.println("Failed to update calendar event for task: " + e.getMessage());
                    }
                    
                    return ApiResponse.success("Task updated successfully", convertToDTO(updatedTask));
                })
                .orElse(ApiResponse.error("Task not found"));
    }
    
    @Transactional
    public ApiResponse<Void> deleteTask(Long id, Long deletedById) {
        return taskRepository.findById(id)
                .map(task -> {
                    String taskName = task.getName();
                    taskRepository.delete(task);
                    
                    // Log activity
                    userRepository.findById(deletedById).ifPresent(user -> 
                        activityLogService.logActivity(
                            ActivityLog.ActivityType.TASK_DELETED,
                            "Task '" + taskName + "' was deleted",
                            user,
                            "TASK",
                            id,
                            null
                        )
                    );
                    
                    return ApiResponse.<Void>success("Task deleted successfully", null);
                })
                .orElse(ApiResponse.error("Task not found"));
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<TaskDTO> getTasksByAssignedUser(Long userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("deadline").ascending());
        Page<Task> taskPage = taskRepository.findByAssignedToId(userId, pageable);
        
        List<TaskDTO> taskDTOs = taskPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(taskDTOs, taskPage.getNumber(), taskPage.getSize(),
                taskPage.getTotalElements(), taskPage.getTotalPages(),
                taskPage.isFirst(), taskPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<TaskDTO> getTasksByProject(Long projectId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("deadline").ascending());
        Page<Task> taskPage = taskRepository.findByProjectId(projectId, pageable);
        
        List<TaskDTO> taskDTOs = taskPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(taskDTOs, taskPage.getNumber(), taskPage.getSize(),
                taskPage.getTotalElements(), taskPage.getTotalPages(),
                taskPage.isFirst(), taskPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public PagedResponse<TaskDTO> getTasksByStatus(Task.TaskStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("deadline").ascending());
        Page<Task> taskPage = taskRepository.findByStatus(status, pageable);
        
        List<TaskDTO> taskDTOs = taskPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return PagedResponse.of(taskDTOs, taskPage.getNumber(), taskPage.getSize(),
                taskPage.getTotalElements(), taskPage.getTotalPages(),
                taskPage.isFirst(), taskPage.isLast());
    }
    
    @Transactional(readOnly = true)
    public List<TaskDTO> getOverdueTasks() {
        List<Task> overdueTasks = taskRepository.findOverdueTasks(LocalDate.now());
        return overdueTasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ApiResponse<TaskDTO> updateTaskProgress(Long id, Integer progress, String status, Long updatedById) {
        return taskRepository.findById(id)
                .map(task -> {
                    if (progress != null) {
                        task.setProgress(progress);
                    }
                    
                    if (status != null) {
                        try {
                            task.setStatus(Task.TaskStatus.valueOf(status));
                        } catch (IllegalArgumentException e) {
                            // Invalid status, ignore
                        }
                    }
                    
                    // Auto-set status to COMPLETED if progress reaches 100
                    if (progress != null && progress >= 100) {
                        task.setStatus(Task.TaskStatus.COMPLETED);
                        
                        // Log task completion
                        userRepository.findById(updatedById).ifPresent(user -> 
                            activityLogService.logActivity(
                                ActivityLog.ActivityType.TASK_COMPLETED,
                                "Task '" + task.getName() + "' was completed",
                                user,
                                "TASK",
                                task.getId(),
                                null
                            )
                        );
                    }
                    Task updatedTask = taskRepository.save(task);
                    return ApiResponse.success("Task progress updated successfully", convertToDTO(updatedTask));
                })
                .orElse(ApiResponse.error("Task not found"));
    }
    
    private TaskDTO convertToDTO(Task task) {
        Double totalHours = timeLogRepository.getTotalHoursByTaskId(task.getId());
        Long commentCount = commentRepository.countByTaskId(task.getId());
        
        return TaskDTO.builder()
                .id(task.getId())
                .name(task.getName())
                .description(task.getDescription())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectName(task.getProject() != null ? task.getProject().getName() : null)
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? 
                        task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName() : null)
                .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
                .createdByName(task.getCreatedBy() != null ? 
                        task.getCreatedBy().getFirstName() + " " + task.getCreatedBy().getLastName() : null)
                .priority(task.getPriority())
                .difficulty(task.getDifficulty())
                .status(task.getStatus())
                .progress(task.getProgress())
                .deadline(task.getDeadline())
                .reminderType(task.getReminderType())
                .commentCount(commentCount != null ? commentCount.intValue() : 0)
                .totalHoursLogged(totalHours != null ? totalHours : 0.0)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}


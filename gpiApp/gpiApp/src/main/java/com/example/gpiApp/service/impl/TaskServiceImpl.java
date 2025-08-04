package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.TaskCategory;
import com.example.gpiApp.entity.TaskPriority;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskCategoryRepository;
import com.example.gpiApp.repository.TaskPriorityRepository;
import com.example.gpiApp.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {
    
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskCategoryRepository taskCategoryRepository;
    private final TaskPriorityRepository taskPriorityRepository;
    
    @Override
    public TaskDTO createTask(TaskDTO taskDTO) {
        Task task = Task.builder()
                .title(taskDTO.getTitle())
                .description(taskDTO.getDescription())
                .taskType(taskDTO.getTaskType())
                .status(Task.TaskStatus.DRAFT)
                .difficultyLevel(taskDTO.getDifficultyLevel())
                .estimatedHours(taskDTO.getEstimatedHours())
                .actualHours(taskDTO.getActualHours())
                .progressPercentage(BigDecimal.ZERO)
                .startDate(taskDTO.getStartDate())
                .dueDate(taskDTO.getDueDate())
                .build();
        
        // Set created by (current user)
        Optional<allUsers> creator = userRepository.findById(UUID.randomUUID()); // TODO: Get from security context
        creator.ifPresent(task::setCreatedBy);
        
        // Set project if provided
        if (taskDTO.getProjectId() != null) {
            Optional<Project> project = projectRepository.findById(taskDTO.getProjectId());
            project.ifPresent(task::setProject);
        }
        
        // Set category if provided
        if (taskDTO.getCategoryId() != null) {
            Optional<TaskCategory> category = taskCategoryRepository.findById(taskDTO.getCategoryId());
            category.ifPresent(task::setCategory);
        }
        
        // Set priority if provided
        if (taskDTO.getPriorityId() != null) {
            Optional<TaskPriority> priority = taskPriorityRepository.findById(taskDTO.getPriorityId());
            priority.ifPresent(task::setPriority);
        }
        
        Task savedTask = taskRepository.save(task);
        return convertToDTO(savedTask);
    }
    
    @Override
    public TaskDTO updateTask(UUID taskId, TaskDTO taskDTO) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setTitle(taskDTO.getTitle());
            task.setDescription(taskDTO.getDescription());
            task.setDifficultyLevel(taskDTO.getDifficultyLevel());
            task.setEstimatedHours(taskDTO.getEstimatedHours());
            task.setActualHours(taskDTO.getActualHours());
            task.setStartDate(taskDTO.getStartDate());
            task.setDueDate(taskDTO.getDueDate());
            
            // Update project if provided
            if (taskDTO.getProjectId() != null) {
                Optional<Project> project = projectRepository.findById(taskDTO.getProjectId());
                project.ifPresent(task::setProject);
            }
            
            // Update category if provided
            if (taskDTO.getCategoryId() != null) {
                Optional<TaskCategory> category = taskCategoryRepository.findById(taskDTO.getCategoryId());
                category.ifPresent(task::setCategory);
            }
            
            // Update priority if provided
            if (taskDTO.getPriorityId() != null) {
                Optional<TaskPriority> priority = taskPriorityRepository.findById(taskDTO.getPriorityId());
                priority.ifPresent(task::setPriority);
            }
            
            Task updatedTask = taskRepository.save(task);
            return convertToDTO(updatedTask);
        }
        throw new RuntimeException("Task not found");
    }
    
    @Override
    public void deleteTask(UUID taskId) {
        taskRepository.deleteById(taskId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<TaskDTO> getTaskById(UUID taskId) {
        return taskRepository.findById(taskId).map(this::convertToDTO);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByCreator(UUID userId) {
        return taskRepository.findByCreatedByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByStatus(Task.TaskStatus status) {
        return taskRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByType(Task.TaskType taskType) {
        return taskRepository.findByTaskType(taskType).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByCreatorAndStatus(UUID userId, Task.TaskStatus status) {
        return taskRepository.findByCreatorAndStatus(userId, status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getOverdueTasks() {
        return taskRepository.findOverdueTasks(LocalDate.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByUserAndDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        return taskRepository.findTasksByUserAndDateRange(userId, startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByTeam(UUID teamId) {
        return taskRepository.findTasksByTeam(teamId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByDifficulty(Task.DifficultyLevel difficulty) {
        return taskRepository.findByDifficultyLevel(difficulty).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> searchTasksByKeyword(String keyword) {
        return taskRepository.searchTasksByKeyword(keyword).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countTasksByStatus(Task.TaskStatus status) {
        return taskRepository.countTasksByStatus(status);
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countTasksByUserAndStatus(UUID userId, Task.TaskStatus status) {
        if (status == null) {
            return taskRepository.findByCreatedByUserId(userId).size();
        }
        return taskRepository.countTasksByUserAndStatus(userId, status);
    }
    
    @Override
    public TaskDTO updateTaskStatus(UUID taskId, Task.TaskStatus status) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setStatus(status);
            
            if (status == Task.TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
                task.setProgressPercentage(BigDecimal.valueOf(100));
            }
            
            Task updatedTask = taskRepository.save(task);
            return convertToDTO(updatedTask);
        }
        throw new RuntimeException("Task not found");
    }
    
    @Override
    public TaskDTO updateTaskProgress(UUID taskId, Double progressPercentage) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setProgressPercentage(BigDecimal.valueOf(progressPercentage));
            
            if (progressPercentage >= 100) {
                task.setStatus(Task.TaskStatus.COMPLETED);
                task.setCompletedAt(LocalDateTime.now());
            } else if (progressPercentage > 0) {
                task.setStatus(Task.TaskStatus.IN_PROGRESS);
            }
            
            Task updatedTask = taskRepository.save(task);
            return convertToDTO(updatedTask);
        }
        throw new RuntimeException("Task not found");
    }
    
    @Override
    public TaskDTO assignTask(UUID taskId, UUID assigneeId) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        Optional<allUsers> assigneeOpt = userRepository.findById(assigneeId);
        
        if (taskOpt.isPresent() && assigneeOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setStatus(Task.TaskStatus.ASSIGNED);
            Task updatedTask = taskRepository.save(task);
            return convertToDTO(updatedTask);
        }
        throw new RuntimeException("Task or Assignee not found");
    }
    
    @Override
    public TaskDTO completeTask(UUID taskId) {
        return this.updateTaskStatus(taskId, Task.TaskStatus.COMPLETED);
    }
    
    private TaskDTO convertToDTO(Task task) {
        return TaskDTO.builder()
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .description(task.getDescription())
                .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getUserId() : null)
                .createdByName(task.getCreatedBy() != null ? 
                    task.getCreatedBy().getFirstName() + " " + task.getCreatedBy().getLastName() : null)
                .projectId(task.getProject() != null ? task.getProject().getProjectId() : null)
                .projectName(task.getProject() != null ? task.getProject().getProjectName() : null)
                .categoryId(task.getCategory() != null ? task.getCategory().getCategoryId() : null)
                .categoryName(task.getCategory() != null ? task.getCategory().getCategoryName() : null)
                .priorityId(task.getPriority() != null ? task.getPriority().getPriorityId() : null)
                .priorityName(task.getPriority() != null ? task.getPriority().getPriorityName() : null)
                .taskType(task.getTaskType())
                .status(task.getStatus())
                .difficultyLevel(task.getDifficultyLevel())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .progressPercentage(task.getProgressPercentage())
                .startDate(task.getStartDate())
                .dueDate(task.getDueDate())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
} 
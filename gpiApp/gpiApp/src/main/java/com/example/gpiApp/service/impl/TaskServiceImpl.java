package com.example.gpiApp.service.impl;

import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.TaskAssignment;
import com.example.gpiApp.entity.TaskCategory;
import com.example.gpiApp.entity.TaskPriority;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskAssignmentRepository;
import com.example.gpiApp.repository.TaskCategoryRepository;
import com.example.gpiApp.repository.TaskPriorityRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TaskService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskPriorityRepository taskPriorityRepository;
    private final TaskCategoryRepository taskCategoryRepository;

    public TaskServiceImpl(TaskRepository taskRepository,
                           TaskAssignmentRepository taskAssignmentRepository,
                           UserRepository userRepository,
                           ProjectRepository projectRepository,
                           TaskPriorityRepository taskPriorityRepository,
                           TaskCategoryRepository taskCategoryRepository) {
        this.taskRepository = taskRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskPriorityRepository = taskPriorityRepository;
        this.taskCategoryRepository = taskCategoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByManager(String managerUsername) {
        Optional<allUsers> manager = userRepository.findByEmail(managerUsername);
        if (manager.isEmpty()) return new ArrayList<>();
        return taskRepository.findByCreatedByUserId(manager.get().getUserId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByUser(String username) {
        Optional<allUsers> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) return new ArrayList<>();
        Long userId = userOpt.get().getUserId();
        return taskAssignmentRepository.findByAssignedToUserId(userId).stream()
                .map(TaskAssignment::getTask)
                .distinct()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TaskDTO getTaskById(Long id) {
        return taskRepository.findById(id)
                .map(this::toDTO)
                .orElse(null);
    }

    @Override
    public TaskDTO createTask(TaskDTO taskDTO) {
        Task task = new Task();
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(parseTaskStatus(taskDTO.getStatus(), Task.TaskStatus.DRAFT));
        task.setTaskType(Task.TaskType.TEAM);

        // createdBy from authenticated user
        getAuthenticatedUser().ifPresent(task::setCreatedBy);

        if (taskDTO.getProjectId() != null) {
            projectRepository.findById(taskDTO.getProjectId()).ifPresent(task::setProject);
        }

        if (taskDTO.getPriority() != null) {
            TaskPriority priority = findPriorityByName(taskDTO.getPriority());
            if (priority != null) task.setPriority(priority);
        }

        if (taskDTO.getDifficulty() != null) {
            task.setDifficultyLevel(parseDifficulty(taskDTO.getDifficulty()));
        }

        if (taskDTO.getDeadline() != null) {
            task.setDueDate(taskDTO.getDeadline().toLocalDate());
        }

        if (taskDTO.getProgress() != null) {
            task.setProgressPercentage(new BigDecimal(taskDTO.getProgress()));
        }

        Task saved = taskRepository.save(task);
        return toDTO(saved);
    }

    @Override
    public TaskDTO updateTask(TaskDTO taskDTO) {
        if (taskDTO.getId() == null) return null;
        Optional<Task> opt = taskRepository.findById(taskDTO.getId());
        if (opt.isEmpty()) return null;
        Task task = opt.get();

        if (taskDTO.getTitle() != null) task.setTitle(taskDTO.getTitle());
        if (taskDTO.getDescription() != null) task.setDescription(taskDTO.getDescription());
        if (taskDTO.getStatus() != null) task.setStatus(parseTaskStatus(taskDTO.getStatus(), task.getStatus()));
        if (taskDTO.getProjectId() != null) {
            projectRepository.findById(taskDTO.getProjectId()).ifPresent(task::setProject);
        }
        if (taskDTO.getPriority() != null) {
            TaskPriority priority = findPriorityByName(taskDTO.getPriority());
            if (priority != null) task.setPriority(priority);
        }
        if (taskDTO.getDifficulty() != null) task.setDifficultyLevel(parseDifficulty(taskDTO.getDifficulty()));
        if (taskDTO.getDeadline() != null) task.setDueDate(taskDTO.getDeadline().toLocalDate());
        if (taskDTO.getProgress() != null) task.setProgressPercentage(new BigDecimal(taskDTO.getProgress()));

        Task saved = taskRepository.save(task);
        return toDTO(saved);
    }

    @Override
    public boolean deleteTask(Long id) {
        if (!taskRepository.existsById(id)) return false;
        taskRepository.deleteById(id);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTotalTasksCount() {
        return taskRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getActiveTasksCount() {
        return taskRepository.countTasksByStatus(Task.TaskStatus.IN_PROGRESS);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getCompletedTasksCount() {
        return taskRepository.countTasksByStatus(Task.TaskStatus.COMPLETED);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getOverdueTasksCount() {
        return (long) taskRepository.findOverdueTasks(LocalDate.now()).size();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTasksCountByManager(String managerUsername) {
        Optional<allUsers> manager = userRepository.findByEmail(managerUsername);
        return Long.valueOf(manager.map(allUsers -> taskRepository.findByCreatedByUserId(allUsers.getUserId()).size()).orElse(0));
    }

    @Override
    @Transactional(readOnly = true)
    public Long getActiveTasksCountByManager(String managerUsername) {
        Optional<allUsers> manager = userRepository.findByEmail(managerUsername);
        if (manager.isEmpty()) return 0L;
        return taskRepository.countTasksByUserAndStatus(manager.get().getUserId(), Task.TaskStatus.IN_PROGRESS);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getCompletedTasksCountByManager(String managerUsername) {
        Optional<allUsers> manager = userRepository.findByEmail(managerUsername);
        if (manager.isEmpty()) return 0L;
        return taskRepository.countTasksByUserAndStatus(manager.get().getUserId(), Task.TaskStatus.COMPLETED);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getOverdueTasksCountByManager(String managerUsername) {
        Optional<allUsers> manager = userRepository.findByEmail(managerUsername);
        if (manager.isEmpty()) return 0L;
        // Approximate: overdue tasks created by manager
        return (long) taskRepository.findOverdueTasks(LocalDate.now()).stream()
                .filter(t -> t.getCreatedBy() != null && t.getCreatedBy().getUserId().equals(manager.get().getUserId()))
                .count();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getTasksCountByUser(String username) {
        Optional<allUsers> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) return 0L;
        return (long) taskAssignmentRepository.findByAssignedToUserId(userOpt.get().getUserId()).size();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getActiveTasksCountByUser(String username) {
        Optional<allUsers> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) return 0L;
        return (long) taskAssignmentRepository.findByAssignedToAndStatus(userOpt.get().getUserId(), TaskAssignment.AssignmentStatus.ACCEPTED).size();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getCompletedTasksCountByUser(String username) {
        Optional<allUsers> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) return 0L;
        // Approximate: tasks with status COMPLETED that have assignment to user
        return taskAssignmentRepository.findByAssignedToUserId(userOpt.get().getUserId()).stream()
                .map(TaskAssignment::getTask)
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED)
                .distinct()
                .count();
    }

    @Override
    @Transactional(readOnly = true)
    public Long getOverdueTasksCountByUser(String username) {
        Optional<allUsers> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) return 0L;
        LocalDate today = LocalDate.now();
        return taskAssignmentRepository.findByAssignedToUserId(userOpt.get().getUserId()).stream()
                .map(TaskAssignment::getTask)
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today))
                .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED && t.getStatus() != Task.TaskStatus.APPROVED)
                .distinct()
                .count();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTaskStatusDistribution() {
        Map<String, Object> distribution = new HashMap<>();
        for (Task.TaskStatus status : Task.TaskStatus.values()) {
            distribution.put(status.name(), taskRepository.countTasksByStatus(status));
        }
        return distribution;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTeamPerformanceData(String managerUsername) {
        Map<String, Object> performance = new HashMap<>();
        performance.put("averageCompletionTime", 0);
        performance.put("onTimeCompletion", 0);
        performance.put("teamEfficiency", 0);
        return performance;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTaskProgressByUser(String username) {
        Map<String, Object> progress = new HashMap<>();
        List<TaskDTO> tasks = getTasksByUser(username);
        int completed = (int) tasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        int inProgress = (int) tasks.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        int pending = (int) tasks.stream().filter(t -> "DRAFT".equalsIgnoreCase(t.getStatus()) || "PENDING".equalsIgnoreCase(t.getStatus())).count();
        progress.put("completed", completed);
        progress.put("inProgress", inProgress);
        progress.put("pending", pending);
        return progress;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemReports() {
        Map<String, Object> reports = new HashMap<>();
        reports.put("totalTasks", getTotalTasksCount());
        reports.put("completedTasks", getCompletedTasksCount());
        reports.put("overdueTasks", getOverdueTasksCount());
        return reports;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTeamReports(String managerUsername) {
        Map<String, Object> reports = new HashMap<>();
        reports.put("teamTasks", getTasksCountByManager(managerUsername));
        reports.put("teamCompleted", getCompletedTasksCountByManager(managerUsername));
        reports.put("teamOverdue", getOverdueTasksCountByManager(managerUsername));
        return reports;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPersonalReports(String username) {
        Map<String, Object> reports = new HashMap<>();
        reports.put("personalTasks", getTasksCountByUser(username));
        reports.put("personalCompleted", getCompletedTasksCountByUser(username));
        reports.put("personalOverdue", getOverdueTasksCountByUser(username));
        return reports;
    }

    private TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getTaskId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus() != null ? task.getStatus().name() : null);
        if (task.getPriority() != null) dto.setPriority(task.getPriority().getPriorityName());
        if (task.getProject() != null) {
            dto.setProjectId(task.getProject().getProjectId());
            dto.setProjectName(task.getProject().getProjectName());
        }
        if (task.getCreatedBy() != null) dto.setCreatedBy(task.getCreatedBy().getEmail());
        if (task.getDueDate() != null) dto.setDeadline(task.getDueDate().atStartOfDay());
        if (task.getCreatedAt() != null) dto.setCreatedAt(task.getCreatedAt());
        if (task.getUpdatedAt() != null) dto.setUpdatedAt(task.getUpdatedAt());
        if (task.getProgressPercentage() != null) dto.setProgress(task.getProgressPercentage().intValue());

        // derive assignee from accepted assignment if present
        taskAssignmentRepository.findAcceptedAssignmentByTask(task.getTaskId())
                .ifPresent(ass -> dto.setAssignee(ass.getAssignedTo().getEmail()));
        if (task.getDifficultyLevel() != null) dto.setDifficulty(task.getDifficultyLevel().name());
        return dto;
    }

    private Task.TaskStatus parseTaskStatus(String status, Task.TaskStatus fallback) {
        if (status == null) return fallback;
        try { return Task.TaskStatus.valueOf(status.toUpperCase()); } catch (Exception e) { return fallback; }
    }

    private Task.DifficultyLevel parseDifficulty(String difficulty) {
        if (difficulty == null) return null;
        try { return Task.DifficultyLevel.valueOf(difficulty.toUpperCase().replace(' ', '_')); } catch (Exception e) { return null; }
    }

    private TaskPriority findPriorityByName(String name) {
        if (name == null) return null;
        return taskPriorityRepository.findAll().stream()
                .filter(p -> name.equalsIgnoreCase(p.getPriorityName()))
                .findFirst().orElse(null);
    }

    private Optional<allUsers> getAuthenticatedUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return Optional.empty();
            return userRepository.findByEmail(auth.getName());
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
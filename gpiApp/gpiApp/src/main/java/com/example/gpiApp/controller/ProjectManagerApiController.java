package com.example.gpiApp.controller;

import com.example.gpiApp.dto.MessageDTO;
import com.example.gpiApp.dto.TaskAssignmentDTO;
import com.example.gpiApp.dto.TaskDTO;
import com.example.gpiApp.dto.UserDTO;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.TaskAssignment;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.CommentRepository;
import com.example.gpiApp.repository.TaskAssignmentRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pm")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProjectManagerApiController {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final CommentRepository commentRepository;
    private final TaskService taskService;

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('MANAGER','SUPER_ADMIN')")
    public ResponseEntity<List<UserDTO>> getEmployees() {
        List<allUsers> employees = userRepository.findActiveUsersByRole(allUsers.UserRole.EMPLOYEE);
        List<UserDTO> dtos = employees.stream().map(u -> UserDTO.builder()
                .id(u.getUserId())
                .username(u.getEmail())
                .name(u.getFirstName() + " " + u.getLastName())
                .email(u.getEmail())
                .role(u.getUserRole().name())
                .status(Boolean.TRUE.equals(u.getIsActive()) ? "ACTIVE" : "INACTIVE")
                .build()).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/managers")
    @PreAuthorize("hasAnyRole('MANAGER','SUPER_ADMIN')")
    public ResponseEntity<List<UserDTO>> getManagers() {
        List<allUsers> managers = userRepository.findActiveUsersByRole(allUsers.UserRole.MANAGER);
        List<UserDTO> dtos = managers.stream().map(u -> UserDTO.builder()
                .id(u.getUserId())
                .username(u.getEmail())
                .name(u.getFirstName() + " " + u.getLastName())
                .email(u.getEmail())
                .role(u.getUserRole().name())
                .status(Boolean.TRUE.equals(u.getIsActive()) ? "ACTIVE" : "INACTIVE")
                .build()).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('MANAGER','SUPER_ADMIN')")
    public ResponseEntity<TaskDTO> createTask(@RequestBody TaskDTO taskDTO) {
        TaskDTO created = taskService.createTask(taskDTO);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('MANAGER','SUPER_ADMIN')")
    public ResponseEntity<TaskAssignmentDTO> assignTask(@RequestBody TaskAssignmentDTO dto) {
        Optional<Task> taskOpt = taskRepository.findById(dto.getTaskId());
        Optional<allUsers> toOpt = userRepository.findById(dto.getAssignedToId());
        if (taskOpt.isEmpty() || toOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Optional<allUsers> byOpt = userRepository.findByEmail(auth.getName());
        if (byOpt.isEmpty()) return ResponseEntity.status(403).build();

        TaskAssignment assignment = TaskAssignment.builder()
                .task(taskOpt.get())
                .assignedBy(byOpt.get())
                .assignedTo(toOpt.get())
                .assignedAt(LocalDateTime.now())
                .assignmentStatus(TaskAssignment.AssignmentStatus.PENDING)
                .assignmentNotes(dto.getAssignmentNotes())
                .build();

        TaskAssignment saved = taskAssignmentRepository.save(assignment);
        TaskAssignmentDTO res = TaskAssignmentDTO.builder()
                .assignmentId(saved.getAssignmentId())
                .taskId(saved.getTask().getTaskId())
                .taskTitle(saved.getTask().getTitle())
                .assignedById(saved.getAssignedBy().getUserId())
                .assignedByName(saved.getAssignedBy().getFirstName() + " " + saved.getAssignedBy().getLastName())
                .assignedToId(saved.getAssignedTo().getUserId())
                .assignedToName(saved.getAssignedTo().getFirstName() + " " + saved.getAssignedTo().getLastName())
                .assignedAt(saved.getAssignedAt())
                .assignmentStatus(saved.getAssignmentStatus())
                .assignmentNotes(saved.getAssignmentNotes())
                .build();

        // Update task status to ASSIGNED
        Task task = saved.getTask();
        task.setStatus(Task.TaskStatus.ASSIGNED);
        taskRepository.save(task);

        return ResponseEntity.ok(res);
    }

    @GetMapping("/messages")
    @PreAuthorize("hasAnyRole('MANAGER','SUPER_ADMIN')")
    public ResponseEntity<List<MessageDTO>> getMessages() {
        // Simple approach: recent comments as messages
        var comments = commentRepository.findAll();
        List<MessageDTO> messages = comments.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(20)
                .map(c -> MessageDTO.builder()
                        .id(c.getCommentId())
                        .title("Task Comment")
                        .preview(c.getTask() != null ? c.getTask().getTitle() : "")
                        .content(c.getCommentText())
                        .time(c.getCreatedAt() != null ? c.getCreatedAt().toString() : "")
                        .unread(Boolean.TRUE)
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/task-assignments")
    @PreAuthorize("hasAnyRole('MANAGER','SUPER_ADMIN')")
    public ResponseEntity<List<TaskAssignmentDTO>> getTaskAssignments() {
        List<TaskAssignment> assignments = taskAssignmentRepository.findAll();
        List<TaskAssignmentDTO> dtos = assignments.stream()
                .map(a -> TaskAssignmentDTO.builder()
                        .assignmentId(a.getAssignmentId())
                        .taskId(a.getTask().getTaskId())
                        .taskTitle(a.getTask().getTitle())
                        .assignedById(a.getAssignedBy().getUserId())
                        .assignedByName(a.getAssignedBy().getFirstName() + " " + a.getAssignedBy().getLastName())
                        .assignedToId(a.getAssignedTo().getUserId())
                        .assignedToName(a.getAssignedTo().getFirstName() + " " + a.getAssignedTo().getLastName())
                        .assignedAt(a.getAssignedAt())
                        .assignmentStatus(a.getAssignmentStatus())
                        .assignmentNotes(a.getAssignmentNotes())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @DeleteMapping("/messages/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        if (commentRepository.existsById(id)) {
            commentRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}



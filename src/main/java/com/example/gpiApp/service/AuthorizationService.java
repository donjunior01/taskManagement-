package com.example.gpiApp.service;

import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * Central ownership rules for write operations. A project manager may only act on their own
 * projects/tasks (the ones they manage or created); a developer may act on tasks assigned to them;
 * admins may act on everything. Read scoping is handled separately in the query layer.
 */
@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final UserRepository userRepository;

    private boolean isAdmin(Long userId) {
        return userId != null && userRepository.findById(userId)
                .map(u -> u.getRole() == allUsers.Role.ADMIN)
                .orElse(false);
    }

    /** Admin, or the project's assigned manager, or its creator. */
    public boolean canManageProject(Long userId, Project project) {
        if (userId == null) return false;
        if (isAdmin(userId)) return true;
        if (project == null) return false;
        Long managerId = project.getManager() != null ? project.getManager().getId() : null;
        Long creatorId = project.getCreatedBy() != null ? project.getCreatedBy().getId() : null;
        return userId.equals(managerId) || userId.equals(creatorId);
    }

    public void requireProjectManage(Long userId, Project project) {
        if (!canManageProject(userId, project)) {
            throw new AccessDeniedException("You are not allowed to modify this project.");
        }
    }

    /** Task writes: admin / the project's manager or creator / the task's assignee. */
    public boolean canWriteTask(Long userId, Task task) {
        if (userId == null || task == null) return false;
        if (canManageProject(userId, task.getProject())) return true;
        Long assigneeId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;
        return userId.equals(assigneeId);
    }

    public void requireTaskWrite(Long userId, Task task) {
        if (!canWriteTask(userId, task)) {
            throw new AccessDeniedException("You are not allowed to modify this task.");
        }
    }

    /** Stronger than a write: delete is reserved for admins and the project's manager/creator. */
    public void requireTaskManage(Long userId, Task task) {
        if (isAdmin(userId)) return;
        if (task != null && canManageProject(userId, task.getProject())) return;
        throw new AccessDeniedException("You are not allowed to delete this task.");
    }
}

package com.example.gpiApp.service;

import com.example.gpiApp.dto.ChecklistItemDTO;
import com.example.gpiApp.entity.ChecklistItem;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.exception.ResourceNotFoundException;
import com.example.gpiApp.repository.ChecklistItemRepository;
import com.example.gpiApp.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CRUD for task checklist items (sub-tasks).
 */
@Service
@RequiredArgsConstructor
public class ChecklistService {

    private final ChecklistItemRepository checklistItemRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<ChecklistItemDTO> getItems(Long taskId) {
        return checklistItemRepository.findByTaskIdOrderByPositionAscIdAsc(taskId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public ChecklistItemDTO addItem(Long taskId, String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Checklist item title is required");
        }
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        int nextPosition = (int) checklistItemRepository.countByTaskId(taskId);
        ChecklistItem item = ChecklistItem.builder()
                .task(task)
                .title(title.trim())
                .completed(false)
                .position(nextPosition)
                .build();
        return toDTO(checklistItemRepository.save(item));
    }

    @Transactional
    public ChecklistItemDTO toggle(Long itemId) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found with id: " + itemId));
        item.setCompleted(!Boolean.TRUE.equals(item.getCompleted()));
        return toDTO(checklistItemRepository.save(item));
    }

    @Transactional
    public void delete(Long itemId) {
        if (!checklistItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("Checklist item not found with id: " + itemId);
        }
        checklistItemRepository.deleteById(itemId);
    }

    private ChecklistItemDTO toDTO(ChecklistItem i) {
        return ChecklistItemDTO.builder()
                .id(i.getId())
                .taskId(i.getTask() != null ? i.getTask().getId() : null)
                .title(i.getTitle())
                .completed(Boolean.TRUE.equals(i.getCompleted()))
                .position(i.getPosition() != null ? i.getPosition() : 0)
                .createdAt(i.getCreatedAt())
                .build();
    }
}

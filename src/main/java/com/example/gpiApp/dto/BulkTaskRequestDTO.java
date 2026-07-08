package com.example.gpiApp.dto;

import lombok.Data;

import java.util.List;

/**
 * Bulk task operation: apply one {@code action} to every task in {@code ids}. Handled atomically in a
 * single transaction, so either all selected tasks change or none do.
 * <ul>
 *   <li>action "status"   — value = TaskStatus name (COMPLETED also sets progress to 100)</li>
 *   <li>action "priority" — value = TaskPriority name</li>
 *   <li>action "assignee" — value = user id</li>
 *   <li>action "delete"   — value ignored (requires task.delete)</li>
 * </ul>
 */
@Data
public class BulkTaskRequestDTO {
    private List<Long> ids;
    private String action;
    private String value;
}

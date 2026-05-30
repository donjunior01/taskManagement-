package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A checklist / sub-task item exposed to the client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemDTO {
    private Long id;
    private Long taskId;
    private String title;
    private boolean completed;
    private int position;
    private LocalDateTime createdAt;
}

package com.example.gpiApp.dto;

import com.example.gpiApp.entity.KeyResult;
import com.example.gpiApp.entity.Objective;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** An objective together with its key results, for the OKR board. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObjectiveDTO {
    private Long id;
    private String title;
    private String description;
    private String period;
    private Long ownerId;
    private String ownerName;
    private Objective.Status status;
    private LocalDateTime createdAt;
    private List<KeyResult> keyResults;
}

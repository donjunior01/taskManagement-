package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Summary returned after an import: what project was created and how much came in. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultDTO {
    private Long projectId;
    private String projectName;
    private int tasksImported;
    private int cardsSkipped;
    private String source;
}

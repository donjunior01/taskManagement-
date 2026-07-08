package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Unified global-search payload. Results are grouped by entity type so the frontend can render
 * one section per group without post-processing. Everything here is already tenant-scoped by the
 * time it reaches the client (the search runs inside a @Transactional method with the org @Filter).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponseDTO {

    private String query;
    private int total;
    private List<Item> projects;
    private List<Item> tasks;
    private List<Item> wiki;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private String type;      // "project" | "task" | "wiki"
        private Long id;
        private String title;
        private String subtitle;  // e.g. project name for a task, or status
        private String snippet;   // short excerpt of the matching description/content
    }
}

package com.example.gpiApp.dto;

import lombok.Data;

/** Payload for a Jira CSV import: the raw exported CSV text and an optional name for the new project. */
@Data
public class JiraImportDTO {
    private String projectName;
    private String csv;
}

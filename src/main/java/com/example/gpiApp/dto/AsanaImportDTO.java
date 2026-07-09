package com.example.gpiApp.dto;

import lombok.Data;

/** Payload for an Asana CSV import: the raw exported CSV text and an optional name for the new project. */
@Data
public class AsanaImportDTO {
    private String projectName;
    private String csv;
}

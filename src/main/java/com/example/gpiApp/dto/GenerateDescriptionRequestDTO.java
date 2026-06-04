package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to have the assistant draft a description.
 * {@code type} is one of PROJECT, TASK, DELIVERABLE. {@code name} is the title to expand on.
 * {@code context} is optional free text (e.g. the parent project name or extra notes).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateDescriptionRequestDTO {
    private String type;
    private String name;
    private String context;
}

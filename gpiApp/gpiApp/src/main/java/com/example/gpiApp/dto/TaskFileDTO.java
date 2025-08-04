package com.example.gpiApp.dto;

import com.example.gpiApp.entity.TaskFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskFileDTO {
    private UUID fileId;
    private UUID taskId;
    private String taskTitle;
    private UUID uploadedById;
    private String uploadedByName;
    private String originalFilename;
    private String storedFilename;
    private String filePath;
    private String mimeType;
    private Long fileSizeBytes;
    private TaskFile.FileType fileType;
    private Boolean isDeliverable;
    private TaskFile.ApprovalStatus approvalStatus;
    private UUID approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private LocalDateTime uploadedAt;
} 
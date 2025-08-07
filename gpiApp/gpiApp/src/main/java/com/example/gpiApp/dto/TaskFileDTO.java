package com.example.gpiApp.dto;

import com.example.gpiApp.entity.TaskFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskFileDTO {
    private Long fileId;
    private Long taskId;
    private String taskTitle;
    private Long uploadedById;
    private String uploadedByName;
    private String originalFilename;
    private String storedFilename;
    private String filePath;
    private String mimeType;
    private Long fileSizeBytes;
    private TaskFile.FileType fileType;
    private Boolean isDeliverable;
    private TaskFile.ApprovalStatus approvalStatus;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private LocalDateTime uploadedAt;
} 
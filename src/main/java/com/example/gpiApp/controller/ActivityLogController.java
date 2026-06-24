package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ActivityLogDTO;
import com.example.gpiApp.dto.PagedResponse;
import com.example.gpiApp.entity.ActivityLog;
import com.example.gpiApp.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("@perm.has('audit.view')")
public class ActivityLogController {
    
    private final ActivityLogService activityLogService;
    
    @GetMapping
    public ResponseEntity<PagedResponse<ActivityLogDTO>> getAllActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(activityLogService.getAllActivityLogs(page, size));
    }

    /** Admin-only tamper-evident audit export (SHA-256 stamped). Guarded by the /api/activity-logs/** ADMIN rule. */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportComplianceReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        String csv = activityLogService.exportComplianceCsv(from, to);
        byte[] body = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String filename = "audit-report-" + java.time.LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", "text/csv; charset=utf-8")
                .body(body);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<ActivityLogDTO>> getActivityLogsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(activityLogService.getActivityLogsByUser(userId, page, size));
    }
    
    @GetMapping("/type/{activityType}")
    public ResponseEntity<PagedResponse<ActivityLogDTO>> getActivityLogsByType(
            @PathVariable ActivityLog.ActivityType activityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(activityLogService.getActivityLogsByType(activityType, page, size));
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<PagedResponse<ActivityLogDTO>> getActivityLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(activityLogService.getActivityLogsByDateRange(startDate, endDate, page, size));
    }
    
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<ActivityLogDTO>> getActivityLogsByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return ResponseEntity.ok(activityLogService.getActivityLogsByEntity(entityType, entityId));
    }
}


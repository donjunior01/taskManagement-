package com.example.gpiApp.controller;

import com.example.gpiApp.dto.ActivityLogDTO;
import com.example.gpiApp.dto.ApiResponse;
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
public class ActivityLogController {
    
    private final ActivityLogService activityLogService;
    
    @GetMapping
    public ResponseEntity<PagedResponse<ActivityLogDTO>> getAllActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(activityLogService.getAllActivityLogs(page, size));
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
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteActivityLog(@PathVariable Long id) {
        activityLogService.deleteActivityLog(id);
        return ResponseEntity.ok(ApiResponse.success("Activity log deleted successfully"));
    }
    
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<String>> deleteAllActivityLogs() {
        activityLogService.deleteAllActivityLogs();
        return ResponseEntity.ok(ApiResponse.success("All activity logs deleted successfully"));
    }
}


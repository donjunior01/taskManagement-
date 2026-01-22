package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TimeLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/time-logs")
@RequiredArgsConstructor
@Tag(name = "Time Logs", description = "Time tracking and logging operations")
public class TimeLogController {
    
    private final TimeLogService timeLogService;
    private final UserRepository userRepository;
    
    @Operation(summary = "Get all time logs", description = "Retrieve paginated list of all time logs")
    @GetMapping
    public ResponseEntity<PagedResponse<TimeLogDTO>> getAllTimeLogs(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(timeLogService.getAllTimeLogs(page, size));
    }
    
    @Operation(summary = "Get time log by ID", description = "Retrieve a specific time log by its ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDTO>> getTimeLogById(
            @Parameter(description = "Time log ID") @PathVariable Long id) {
        return ResponseEntity.ok(timeLogService.getTimeLogById(id));
    }
    
    @Operation(summary = "Create time log", description = "Log time spent on a task")
    @PostMapping
    public ResponseEntity<ApiResponse<TimeLogDTO>> createTimeLog(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Time log details") @RequestBody TimeLogRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(timeLogService.createTimeLog(request, userId));
    }
    
    @Operation(summary = "Update time log", description = "Update an existing time log")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDTO>> updateTimeLog(
            @Parameter(description = "Time log ID") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Updated time log details") @RequestBody TimeLogRequestDTO request) {
        return ResponseEntity.ok(timeLogService.updateTimeLog(id, request));
    }
    
    @Operation(summary = "Delete time log", description = "Delete a time log")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTimeLog(
            @Parameter(description = "Time log ID") @PathVariable Long id) {
        return ResponseEntity.ok(timeLogService.deleteTimeLog(id));
    }
    
    @Operation(summary = "Get time logs by task", description = "Retrieve all time logs for a specific task")
    @GetMapping("/task/{taskId}")
    public ResponseEntity<PagedResponse<TimeLogDTO>> getTimeLogsByTask(
            @Parameter(description = "Task ID") @PathVariable Long taskId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(timeLogService.getTimeLogsByTask(taskId, page, size));
    }
    
    @Operation(summary = "Get time logs by user", description = "Retrieve all time logs for a specific user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<TimeLogDTO>> getTimeLogsByUser(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(timeLogService.getTimeLogsByUser(userId, page, size));
    }
    
    @Operation(summary = "Get my time logs", description = "Retrieve time logs for the current user")
    @GetMapping("/my-logs")
    public ResponseEntity<PagedResponse<TimeLogDTO>> getMyTimeLogs(
            Authentication authentication,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(timeLogService.getTimeLogsByUser(userId, page, size));
    }
    
    @Operation(summary = "Get my time logs (simple)", description = "Retrieve all time logs for the current user without pagination")
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<java.util.List<TimeLogDTO>>> getMyTimeLogsSimple(
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User not authenticated"));
        }
        PagedResponse<TimeLogDTO> response = timeLogService.getTimeLogsByUser(userId, 0, 100);
        return ResponseEntity.ok(ApiResponse.success("Time logs retrieved", response.getData()));
    }
    
    @Operation(summary = "Get total hours by task", description = "Get total hours logged for a specific task")
    @GetMapping("/task/{taskId}/total")
    public ResponseEntity<ApiResponse<Double>> getTotalHoursByTask(
            @Parameter(description = "Task ID") @PathVariable Long taskId) {
        return ResponseEntity.ok(timeLogService.getTotalHoursByTask(taskId));
    }
    
    @Operation(summary = "Get total hours by user", description = "Get total hours logged by a specific user")
    @GetMapping("/user/{userId}/total")
    public ResponseEntity<ApiResponse<Double>> getTotalHoursByUser(
            @Parameter(description = "User ID") @PathVariable Long userId) {
        return ResponseEntity.ok(timeLogService.getTotalHoursByUser(userId));
    }
    
    @Operation(summary = "Get time logs by date range", description = "Retrieve time logs for a user within a date range")
    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<TimeLogDTO>> getTimeLogsByUserAndDateRange(
            @Parameter(description = "User ID") @PathVariable Long userId,
            @Parameter(description = "Start date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(timeLogService.getTimeLogsByUserAndDateRange(userId, startDate, endDate));
    }
    
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null) {
            return userRepository.findByEmail(authentication.getName())
                    .map(allUsers::getId)
                    .orElse(null);
        }
        return null;
    }
}


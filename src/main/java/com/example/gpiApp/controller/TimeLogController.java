package com.example.gpiApp.controller;

import com.example.gpiApp.dto.*;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.TimeLogService;
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
public class TimeLogController {
    
    private final TimeLogService timeLogService;
    private final UserRepository userRepository;
    
    @GetMapping
    public ResponseEntity<PagedResponse<TimeLogDTO>> getAllTimeLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(timeLogService.getAllTimeLogs(page, size));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDTO>> getTimeLogById(@PathVariable Long id) {
        return ResponseEntity.ok(timeLogService.getTimeLogById(id));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<TimeLogDTO>> createTimeLog(
            @RequestBody TimeLogRequestDTO request,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(timeLogService.createTimeLog(request, userId));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDTO>> updateTimeLog(
            @PathVariable Long id,
            @RequestBody TimeLogRequestDTO request) {
        return ResponseEntity.ok(timeLogService.updateTimeLog(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTimeLog(@PathVariable Long id) {
        return ResponseEntity.ok(timeLogService.deleteTimeLog(id));
    }
    
    @GetMapping("/task/{taskId}")
    public ResponseEntity<PagedResponse<TimeLogDTO>> getTimeLogsByTask(
            @PathVariable Long taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(timeLogService.getTimeLogsByTask(taskId, page, size));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<TimeLogDTO>> getTimeLogsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(timeLogService.getTimeLogsByUser(userId, page, size));
    }
    
    @GetMapping("/my-logs")
    public ResponseEntity<PagedResponse<TimeLogDTO>> getMyTimeLogs(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(timeLogService.getTimeLogsByUser(userId, page, size));
    }
    
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
    
    @GetMapping("/task/{taskId}/total")
    public ResponseEntity<ApiResponse<Double>> getTotalHoursByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeLogService.getTotalHoursByTask(taskId));
    }
    
    @GetMapping("/user/{userId}/total")
    public ResponseEntity<ApiResponse<Double>> getTotalHoursByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(timeLogService.getTotalHoursByUser(userId));
    }
    
    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<TimeLogDTO>> getTimeLogsByUserAndDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
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


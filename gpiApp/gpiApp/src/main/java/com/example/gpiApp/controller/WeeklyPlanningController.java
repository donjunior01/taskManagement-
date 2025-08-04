package com.example.gpiApp.controller;

import com.example.gpiApp.dto.WeeklyPlanningDTO;
import com.example.gpiApp.service.WeeklyPlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/weekly-plannings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WeeklyPlanningController {
    
    private final WeeklyPlanningService weeklyPlanningService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<WeeklyPlanningDTO>> getAllWeeklyPlannings() {
        return ResponseEntity.ok(weeklyPlanningService.getAllWeeklyPlannings());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WeeklyPlanningDTO> getWeeklyPlanningById(@PathVariable UUID id) {
        return weeklyPlanningService.getWeeklyPlanningById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WeeklyPlanningDTO> createWeeklyPlanning(@RequestBody WeeklyPlanningDTO weeklyPlanningDTO) {
        return ResponseEntity.ok(weeklyPlanningService.createWeeklyPlanning(weeklyPlanningDTO));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WeeklyPlanningDTO> updateWeeklyPlanning(@PathVariable UUID id, @RequestBody WeeklyPlanningDTO weeklyPlanningDTO) {
        return ResponseEntity.ok(weeklyPlanningService.updateWeeklyPlanning(id, weeklyPlanningDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteWeeklyPlanning(@PathVariable UUID id) {
        weeklyPlanningService.deleteWeeklyPlanning(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<List<WeeklyPlanningDTO>> getWeeklyPlanningsByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(weeklyPlanningService.getWeeklyPlanningsByUser(userId));
    }
    
    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WeeklyPlanningDTO> getCurrentWeeklyPlanning() {
        return weeklyPlanningService.getCurrentWeeklyPlanning()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WeeklyPlanningDTO> submitWeeklyPlanning(@PathVariable UUID id) {
        return ResponseEntity.ok(weeklyPlanningService.submitWeeklyPlanning(id));
    }
    
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WeeklyPlanningDTO> approveWeeklyPlanning(@PathVariable UUID id, @RequestParam UUID approverId) {
        return ResponseEntity.ok(weeklyPlanningService.approveWeeklyPlanning(id, approverId));
    }
    
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WeeklyPlanningDTO> rejectWeeklyPlanning(@PathVariable UUID id, @RequestParam UUID approverId, @RequestParam String reason) {
        return ResponseEntity.ok(weeklyPlanningService.rejectWeeklyPlanning(id, approverId, reason));
    }
} 
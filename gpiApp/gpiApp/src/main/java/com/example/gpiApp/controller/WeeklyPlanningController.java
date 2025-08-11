package com.example.gpiApp.controller;

import com.example.gpiApp.dto.WeeklyPlanningDTO;
import com.example.gpiApp.service.WeeklyPlanningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/weekly-plannings")
public class WeeklyPlanningController {

    @Autowired
    private WeeklyPlanningService weeklyPlanningService;

    @PostMapping
    public ResponseEntity<WeeklyPlanningDTO> createWeeklyPlanning(@RequestBody WeeklyPlanningDTO weeklyPlanningDTO) {
        WeeklyPlanningDTO created = weeklyPlanningService.createWeeklyPlanning(weeklyPlanningDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WeeklyPlanningDTO> getWeeklyPlanningById(@PathVariable Long id) {
        return weeklyPlanningService.getWeeklyPlanningById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<WeeklyPlanningDTO>> getAllWeeklyPlannings() {
        List<WeeklyPlanningDTO> plannings = weeklyPlanningService.getAllWeeklyPlannings();
        return ResponseEntity.ok(plannings);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WeeklyPlanningDTO> updateWeeklyPlanning(@PathVariable Long id, @RequestBody WeeklyPlanningDTO weeklyPlanningDTO) {
        WeeklyPlanningDTO updated = weeklyPlanningService.updateWeeklyPlanning(id, weeklyPlanningDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWeeklyPlanning(@PathVariable Long id) {
        weeklyPlanningService.deleteWeeklyPlanning(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WeeklyPlanningDTO>> getWeeklyPlanningsByUser(@PathVariable Long userId) {
        List<WeeklyPlanningDTO> plannings = weeklyPlanningService.getWeeklyPlanningsByUser(userId);
        return ResponseEntity.ok(plannings);
    }

    @GetMapping("/user/{userId}/week/{weekNumber}/year/{year}")
    public ResponseEntity<WeeklyPlanningDTO> getWeeklyPlanningByUserAndWeek(
            @PathVariable Long userId,
            @PathVariable Integer weekNumber,
            @PathVariable Integer year) {
        return weeklyPlanningService.getWeeklyPlanningByUserAndWeek(userId, weekNumber, year)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<WeeklyPlanningDTO> submitWeeklyPlanning(@PathVariable Long id) {
        WeeklyPlanningDTO submitted = weeklyPlanningService.submitWeeklyPlanning(id);
        return ResponseEntity.ok(submitted);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<WeeklyPlanningDTO> approveWeeklyPlanning(@PathVariable Long id, @RequestParam Long approverId) {
        WeeklyPlanningDTO approved = weeklyPlanningService.approveWeeklyPlanning(id, approverId);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<WeeklyPlanningDTO> rejectWeeklyPlanning(@PathVariable Long id, @RequestParam Long approverId, @RequestParam String reason) {
        WeeklyPlanningDTO rejected = weeklyPlanningService.rejectWeeklyPlanning(id, approverId, reason);
        return ResponseEntity.ok(rejected);
    }
} 
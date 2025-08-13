package com.example.gpiApp.controller;

import com.example.gpiApp.dto.DailyTaskScheduleDTO;
import com.example.gpiApp.service.DailyTaskScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/daily-task-schedules")
public class DailyTaskScheduleController {

    @Autowired
    private DailyTaskScheduleService dailyTaskScheduleService;

    @PostMapping
    public ResponseEntity<DailyTaskScheduleDTO> createDailyTaskSchedule(@RequestBody DailyTaskScheduleDTO scheduleDTO) {
        DailyTaskScheduleDTO created = dailyTaskScheduleService.createDailyTaskSchedule(scheduleDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DailyTaskScheduleDTO> getDailyTaskScheduleById(@PathVariable Long id) {
        return dailyTaskScheduleService.getDailyTaskScheduleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<DailyTaskScheduleDTO>> getAllDailyTaskSchedules() {
        List<DailyTaskScheduleDTO> schedules = dailyTaskScheduleService.getAllDailyTaskSchedules();
        return ResponseEntity.ok(schedules);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DailyTaskScheduleDTO> updateDailyTaskSchedule(@PathVariable Long id, @RequestBody DailyTaskScheduleDTO scheduleDTO) {
        DailyTaskScheduleDTO updated = dailyTaskScheduleService.updateDailyTaskSchedule(id, scheduleDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDailyTaskSchedule(@PathVariable Long id) {
        dailyTaskScheduleService.deleteDailyTaskSchedule(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/planning/{planningId}")
    public ResponseEntity<List<DailyTaskScheduleDTO>> getDailyTaskSchedulesByPlanningId(@PathVariable Long planningId) {
        List<DailyTaskScheduleDTO> schedules = dailyTaskScheduleService.getDailyTaskSchedulesByPlanningId(planningId);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<DailyTaskScheduleDTO>> getDailyTaskSchedulesByDate(@PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<DailyTaskScheduleDTO> schedules = dailyTaskScheduleService.getDailyTaskSchedulesByDate(localDate);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/user/{userId}/date/{date}")
    public ResponseEntity<List<DailyTaskScheduleDTO>> getDailyTaskSchedulesByUserAndDate(@PathVariable Long userId, @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<DailyTaskScheduleDTO> schedules = dailyTaskScheduleService.getDailyTaskSchedulesByUserAndDate(userId, localDate);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/user/{userId}/week/{weekNumber}/year/{year}")
    public ResponseEntity<List<DailyTaskScheduleDTO>> getDailyTaskSchedulesByUserAndWeek(
            @PathVariable Long userId,
            @PathVariable Integer weekNumber,
            @PathVariable Integer year) {
        List<DailyTaskScheduleDTO> schedules = dailyTaskScheduleService.getDailyTaskSchedulesByUserAndWeek(userId, weekNumber, year);
        return ResponseEntity.ok(schedules);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<DailyTaskScheduleDTO> markTaskAsCompleted(@PathVariable Long id) {
        DailyTaskScheduleDTO completed = dailyTaskScheduleService.markTaskAsCompleted(id);
        return ResponseEntity.ok(completed);
    }

    @PostMapping("/{id}/incomplete")
    public ResponseEntity<DailyTaskScheduleDTO> markTaskAsIncomplete(@PathVariable Long id) {
        DailyTaskScheduleDTO incomplete = dailyTaskScheduleService.markTaskAsIncomplete(id);
        return ResponseEntity.ok(incomplete);
    }
} 
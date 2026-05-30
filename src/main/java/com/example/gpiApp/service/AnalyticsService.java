package com.example.gpiApp.service;

import com.example.gpiApp.dto.analytics.ManagerAnalyticsDTO;
import com.example.gpiApp.dto.analytics.MemberWorkloadDTO;
import com.example.gpiApp.dto.analytics.WeeklyPointDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Computes portfolio analytics for a project manager: delivery KPIs (on-time rate,
 * average completion time), an eight-week velocity/completion trend, and per-member
 * workload. Everything is derived in-memory from the manager's projects' tasks, so no
 * new persistence queries or schema changes are needed.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final int TREND_WEEKS = 8;
    private static final DateTimeFormatter WEEK_LABEL = DateTimeFormatter.ofPattern("MMM d");

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public ManagerAnalyticsDTO getManagerAnalytics(Long managerId) {
        List<Project> projects = projectRepository.findByManagerId(managerId, Pageable.unpaged()).getContent();
        List<Task> tasks = new ArrayList<>();
        for (Project p : projects) {
            tasks.addAll(taskRepository.findByProject(p));
        }
        return build(projects.size(), tasks);
    }

    private ManagerAnalyticsDTO build(int projectCount, List<Task> tasks) {
        LocalDate today = LocalDate.now();

        long completed = countStatus(tasks, Task.TaskStatus.COMPLETED);
        long inProgress = countStatus(tasks, Task.TaskStatus.IN_PROGRESS);
        long todo = countStatus(tasks, Task.TaskStatus.TODO);
        long onHold = countStatus(tasks, Task.TaskStatus.ON_HOLD);
        long total = tasks.size();
        long open = total - completed;
        long overdue = tasks.stream()
                .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED)
                .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(today))
                .count();

        // On-time completion rate over completed tasks that had a deadline.
        long completedWithDeadline = 0;
        long onTime = 0;
        double completionDaysSum = 0;
        long completionDaysCount = 0;
        for (Task t : tasks) {
            if (t.getStatus() != Task.TaskStatus.COMPLETED) continue;
            LocalDate finished = completionDate(t);
            if (t.getDeadline() != null && finished != null) {
                completedWithDeadline++;
                if (!finished.isAfter(t.getDeadline())) onTime++;
            }
            if (t.getCreatedAt() != null && finished != null) {
                long days = ChronoUnit.DAYS.between(t.getCreatedAt().toLocalDate(), finished);
                if (days >= 0) { completionDaysSum += days; completionDaysCount++; }
            }
        }
        double onTimeRate = completedWithDeadline > 0 ? round1((double) onTime / completedWithDeadline * 100) : 0;
        double avgCompletionDays = completionDaysCount > 0 ? round1(completionDaysSum / completionDaysCount) : 0;

        List<WeeklyPointDTO> trend = weeklyTrend(tasks, today);
        long velocity4w = tasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED)
                .map(this::completionDate)
                .filter(d -> d != null && !d.isBefore(today.minusDays(28)))
                .count();

        List<MemberWorkloadDTO> workload = workloadByMember(tasks);

        return ManagerAnalyticsDTO.builder()
                .totalProjects(projectCount)
                .totalTasks(total)
                .completedTasks(completed)
                .openTasks(open)
                .overdueTasks(overdue)
                .inProgressTasks(inProgress)
                .todoTasks(todo)
                .onHoldTasks(onHold)
                .onTimeCompletionRate(onTimeRate)
                .avgCompletionDays(avgCompletionDays)
                .velocityLast4Weeks(velocity4w)
                .weeklyTrend(trend)
                .workloadByMember(workload)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /** Eight weekly buckets (oldest first) of tasks created vs completed. */
    private List<WeeklyPointDTO> weeklyTrend(List<Task> tasks, LocalDate today) {
        long[] created = new long[TREND_WEEKS];
        long[] completed = new long[TREND_WEEKS];
        // Bucket index 0 = oldest week, TREND_WEEKS-1 = current week.
        for (Task t : tasks) {
            if (t.getCreatedAt() != null) {
                int idx = weekIndex(t.getCreatedAt().toLocalDate(), today);
                if (idx >= 0 && idx < TREND_WEEKS) created[idx]++;
            }
            if (t.getStatus() == Task.TaskStatus.COMPLETED) {
                LocalDate done = completionDate(t);
                if (done != null) {
                    int idx = weekIndex(done, today);
                    if (idx >= 0 && idx < TREND_WEEKS) completed[idx]++;
                }
            }
        }
        List<WeeklyPointDTO> points = new ArrayList<>();
        for (int i = 0; i < TREND_WEEKS; i++) {
            int weeksAgo = TREND_WEEKS - 1 - i;
            LocalDate weekStart = today.minusWeeks(weeksAgo);
            points.add(WeeklyPointDTO.builder()
                    .label(weekStart.format(WEEK_LABEL))
                    .created(created[i])
                    .completed(completed[i])
                    .build());
        }
        return points;
    }

    /** 0..TREND_WEEKS-1 where TREND_WEEKS-1 is the current week; -1 if outside the window. */
    private int weekIndex(LocalDate date, LocalDate today) {
        long daysAgo = ChronoUnit.DAYS.between(date, today);
        if (daysAgo < 0) return TREND_WEEKS - 1; // future-dated → current week
        int weeksAgo = (int) (daysAgo / 7);
        if (weeksAgo >= TREND_WEEKS) return -1;
        return TREND_WEEKS - 1 - weeksAgo;
    }

    private List<MemberWorkloadDTO> workloadByMember(List<Task> tasks) {
        Map<String, long[]> byMember = new LinkedHashMap<>(); // name -> [open, completed]
        for (Task t : tasks) {
            if (t.getAssignedTo() == null) continue;
            String name = displayName(t.getAssignedTo());
            long[] counts = byMember.computeIfAbsent(name, k -> new long[2]);
            if (t.getStatus() == Task.TaskStatus.COMPLETED) counts[1]++;
            else counts[0]++;
        }
        List<MemberWorkloadDTO> list = new ArrayList<>();
        byMember.forEach((name, c) -> list.add(MemberWorkloadDTO.builder()
                .memberName(name).openTasks(c[0]).completedTasks(c[1]).build()));
        list.sort(Comparator.comparingLong(MemberWorkloadDTO::getOpenTasks).reversed());
        return list.size() > 8 ? list.subList(0, 8) : list;
    }

    private LocalDate completionDate(Task t) {
        // Best available proxy for when a task was completed.
        if (t.getUpdatedAt() != null) return t.getUpdatedAt().toLocalDate();
        if (t.getCreatedAt() != null) return t.getCreatedAt().toLocalDate();
        return null;
    }

    private long countStatus(List<Task> tasks, Task.TaskStatus status) {
        return tasks.stream().filter(t -> t.getStatus() == status).count();
    }

    private String displayName(allUsers u) {
        String first = u.getFirstName() != null ? u.getFirstName() : "";
        String last = u.getLastName() != null ? u.getLastName() : "";
        String full = (first + " " + last).trim();
        if (!full.isEmpty()) return full;
        return u.getUsername() != null ? u.getUsername() : "Unassigned";
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}

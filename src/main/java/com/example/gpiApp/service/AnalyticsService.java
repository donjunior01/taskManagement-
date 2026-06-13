package com.example.gpiApp.service;

import com.example.gpiApp.dto.analytics.AdminReportsDTO;
import com.example.gpiApp.dto.analytics.ManagerAnalyticsDTO;
import com.example.gpiApp.dto.analytics.MemberWorkloadDTO;
import com.example.gpiApp.dto.analytics.WeeklyPointDTO;
import com.example.gpiApp.entity.LoginAttempt;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.SupportTicket;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.Team;
import com.example.gpiApp.entity.TimeLog;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.LoginAttemptRepository;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.SupportTicketRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.TeamRepository;
import com.example.gpiApp.repository.TimeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

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

    private static final Locale FR = Locale.FRENCH;

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final TimeLogRepository timeLogRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public ManagerAnalyticsDTO getManagerAnalytics(Long managerId) {
        List<Project> projects = projectRepository.findByManagerId(managerId, Pageable.unpaged()).getContent();
        List<Task> tasks = new ArrayList<>();
        for (Project p : projects) {
            tasks.addAll(taskRepository.findByProject(p));
        }
        return build(projects.size(), tasks);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Admin "Rapports" — portfolio-wide analytics from real persisted data
    // ──────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public AdminReportsDTO getAdminReports(String period) {
        List<Project> projects = projectRepository.findAll();
        List<Task> tasks = taskRepository.findAll();
        List<SupportTicket> tickets = supportTicketRepository.findAll();
        List<TimeLog> timeLogs = timeLogRepository.findAll();
        List<LoginAttempt> attempts = loginAttemptRepository.findAll();
        List<Team> teams = teamRepository.findAll();

        LocalDate today = LocalDate.now();
        // Window start for the period filter (null = all-time / "Personnalisé").
        final LocalDate since = windowStart(period, today);

        // Time-bound subsets used by the period-sensitive metrics.
        List<TimeLog> windowLogs = since == null ? timeLogs
                : timeLogs.stream().filter(l -> l.getLogDate() != null && !l.getLogDate().isBefore(since)).collect(Collectors.toList());
        List<SupportTicket> windowTickets = since == null ? tickets
                : tickets.stream().filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().toLocalDate().isBefore(since)).collect(Collectors.toList());
        List<Task> windowCompleted = tasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED)
                .filter(t -> { LocalDate f = completionDate(t); return since == null || (f != null && !f.isBefore(since)); })
                .collect(Collectors.toList());

        // ── Executive KPIs ──
        long totalTasks = tasks.size();
        long completedTasks = countStatus(tasks, Task.TaskStatus.COMPLETED);
        double completionRate = totalTasks > 0 ? round1((double) completedTasks / totalTasks * 100) : 0;

        long completedWithDeadline = 0, onTime = 0;
        for (Task t : windowCompleted) {
            LocalDate finished = completionDate(t);
            if (t.getDeadline() != null && finished != null) {
                completedWithDeadline++;
                if (!finished.isAfter(t.getDeadline())) onTime++;
            }
        }
        double onTimeRate = completedWithDeadline > 0 ? round1((double) onTime / completedWithDeadline * 100) : 0;

        double totalHours = round1(windowLogs.stream()
                .filter(l -> l.getHoursSpent() != null).mapToDouble(TimeLog::getHoursSpent).sum());

        long ticketsTotal = windowTickets.size();
        long ticketsResolved = windowTickets.stream()
                .filter(t -> t.getStatus() == SupportTicket.Status.RESOLVED || t.getStatus() == SupportTicket.Status.CLOSED)
                .count();
        double resolvedRate = ticketsTotal > 0 ? round1((double) ticketsResolved / ticketsTotal * 100) : 0;
        double supportSatisfaction = round1(resolvedRate / 100 * 5);

        double avgResolutionHours = round1(windowTickets.stream()
                .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
                .mapToLong(t -> ChronoUnit.HOURS.between(t.getCreatedAt(), t.getResolvedAt()))
                .filter(h -> h >= 0).average().orElse(0));

        return AdminReportsDTO.builder()
                .completionRate(completionRate)
                .onTimeRate(onTimeRate)
                .totalHours(totalHours)
                .supportSatisfaction(supportSatisfaction)
                .resolvedRate(resolvedRate)
                .avgResolutionHours(avgResolutionHours)
                .statusOverTime(statusOverTime(projects, today))
                .burndown(burndown(tasks, today))
                .dau(dau(attempts, today))
                .resolutionTrend(resolutionTrend(tickets, today))
                .topPerformers(topPerformers(windowCompleted))
                .teamLoad(teamLoad(teams, tasks))
                .ticketsByCategory(ticketsByPriority(windowTickets))
                .recap(buildRecap(projects, tasks, windowLogs, today))
                .period(period != null ? period : "all")
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /** Window start for the period filter; null means all-time. */
    private LocalDate windowStart(String period, LocalDate today) {
        if (period == null) return null;
        switch (period.toLowerCase()) {
            case "week": case "semaine": return today.minusDays(7);
            case "month": case "mois": return today.minusDays(30);
            case "quarter": case "trimestre": return today.minusDays(90);
            default: return null; // "all" / "personnalisé"
        }
    }

    /** Real per-project recap: task counts, overdue, hours (within the window), progress, status. */
    private List<AdminReportsDTO.RecapRowDTO> buildRecap(List<Project> projects, List<Task> tasks,
                                                         List<TimeLog> windowLogs, LocalDate today) {
        // Hours per project from the (already window-filtered) time logs.
        Map<Long, Double> hoursByProject = new HashMap<>();
        for (TimeLog l : windowLogs) {
            if (l.getHoursSpent() == null || l.getTask() == null || l.getTask().getProject() == null) continue;
            Long pid = l.getTask().getProject().getId();
            hoursByProject.merge(pid, l.getHoursSpent(), Double::sum);
        }
        // Tasks per project.
        Map<Long, List<Task>> tasksByProject = new HashMap<>();
        for (Task t : tasks) {
            if (t.getProject() == null) continue;
            tasksByProject.computeIfAbsent(t.getProject().getId(), k -> new ArrayList<>()).add(t);
        }

        List<AdminReportsDTO.RecapRowDTO> out = new ArrayList<>();
        for (Project p : projects) {
            List<Task> pt = tasksByProject.getOrDefault(p.getId(), List.of());
            long done = pt.stream().filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED).count();
            long overdue = pt.stream()
                    .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED)
                    .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(today))
                    .count();
            out.add(AdminReportsDTO.RecapRowDTO.builder()
                    .nom(p.getName())
                    .pm(p.getManager() != null ? (p.getManager().getFirstName() + " " + p.getManager().getLastName()).trim() : "Non assigné")
                    .taches(pt.size())
                    .terminees(done)
                    .retard(overdue)
                    .heures(round1(hoursByProject.getOrDefault(p.getId(), 0.0)))
                    .progression(p.getProgress() != null ? p.getProgress() : 0)
                    .statut(p.getStatus() != null ? p.getStatus().name() : "PLANNED")
                    .build());
        }
        return out;
    }

    /** Projects bucketed by creation month over the last 12 months, split by current status. */
    private List<AdminReportsDTO.MonthStatusDTO> statusOverTime(List<Project> projects, LocalDate today) {
        List<AdminReportsDTO.MonthStatusDTO> out = new ArrayList<>();
        YearMonth current = YearMonth.from(today);
        for (int back = 11; back >= 0; back--) {
            YearMonth ym = current.minusMonths(back);
            long encours = 0, termine = 0, retard = 0;
            for (Project p : projects) {
                if (p.getCreatedAt() == null) continue;
                if (!YearMonth.from(p.getCreatedAt().toLocalDate()).equals(ym)) continue;
                boolean completed = p.getStatus() == Project.ProjectStatus.COMPLETED;
                boolean overdue = !completed && p.getEndDate() != null && p.getEndDate().isBefore(today);
                if (completed) termine++;
                else if (overdue) retard++;
                else encours++;
            }
            out.add(AdminReportsDTO.MonthStatusDTO.builder()
                    .mois(capitalize(ym.getMonth().getDisplayName(TextStyle.SHORT, FR)))
                    .encours(encours).termine(termine).retard(retard).build());
        }
        return out;
    }

    /** Remaining open tasks per day over the last 14 days (real) vs an ideal linear burndown. */
    private List<AdminReportsDTO.BurndownPointDTO> burndown(List<Task> tasks, LocalDate today) {
        int days = 14;
        long[] remaining = new long[days];
        for (int i = 0; i < days; i++) {
            LocalDate day = today.minusDays(days - 1 - i);
            long open = 0;
            for (Task t : tasks) {
                if (t.getCreatedAt() == null) continue;
                if (t.getCreatedAt().toLocalDate().isAfter(day)) continue; // not created yet
                LocalDate done = t.getStatus() == Task.TaskStatus.COMPLETED ? completionDate(t) : null;
                boolean closedByThen = done != null && !done.isAfter(day);
                if (!closedByThen) open++;
            }
            remaining[i] = open;
        }
        long start = remaining[0];
        List<AdminReportsDTO.BurndownPointDTO> out = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            long ideal = Math.round(start * (1.0 - (double) i / (days - 1)));
            out.add(AdminReportsDTO.BurndownPointDTO.builder()
                    .jour("J" + (i + 1)).ideal(ideal).reel(remaining[i]).build());
        }
        return out;
    }

    /** Distinct successful logins per day over the last 30 days. */
    private List<AdminReportsDTO.DauPointDTO> dau(List<LoginAttempt> attempts, LocalDate today) {
        int days = 30;
        List<AdminReportsDTO.DauPointDTO> out = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate day = today.minusDays(days - 1 - i);
            Set<String> users = new HashSet<>();
            for (LoginAttempt a : attempts) {
                if (a.getStatus() != LoginAttempt.LoginStatus.SUCCESS || a.getAttemptedAt() == null) continue;
                if (!a.getAttemptedAt().toLocalDate().equals(day)) continue;
                String key = a.getUser() != null ? "u" + a.getUser().getId()
                        : (a.getEmail() != null ? a.getEmail() : a.getUsername());
                if (key != null) users.add(key);
            }
            out.add(AdminReportsDTO.DauPointDTO.builder().jour(i + 1).dau(users.size()).build());
        }
        return out;
    }

    /** % of tickets created each month (last 12) that are now resolved/closed. */
    private List<AdminReportsDTO.MonthRateDTO> resolutionTrend(List<SupportTicket> tickets, LocalDate today) {
        List<AdminReportsDTO.MonthRateDTO> out = new ArrayList<>();
        YearMonth current = YearMonth.from(today);
        for (int back = 11; back >= 0; back--) {
            YearMonth ym = current.minusMonths(back);
            long created = 0, resolved = 0;
            for (SupportTicket t : tickets) {
                if (t.getCreatedAt() == null) continue;
                if (!YearMonth.from(t.getCreatedAt().toLocalDate()).equals(ym)) continue;
                created++;
                if (t.getStatus() == SupportTicket.Status.RESOLVED || t.getStatus() == SupportTicket.Status.CLOSED) resolved++;
            }
            double taux = created > 0 ? round1((double) resolved / created * 100) : 0;
            out.add(AdminReportsDTO.MonthRateDTO.builder()
                    .mois(capitalize(ym.getMonth().getDisplayName(TextStyle.SHORT, FR))).taux(taux).build());
        }
        return out;
    }

    /** Top members by number of completed tasks. */
    private List<AdminReportsDTO.PerformerDTO> topPerformers(List<Task> tasks) {
        Map<String, Long> byMember = new LinkedHashMap<>();
        for (Task t : tasks) {
            if (t.getStatus() != Task.TaskStatus.COMPLETED || t.getAssignedTo() == null) continue;
            byMember.merge(displayName(t.getAssignedTo()), 1L, Long::sum);
        }
        return byMember.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(e -> AdminReportsDTO.PerformerDTO.builder().nom(e.getKey()).taches(e.getValue()).build())
                .collect(java.util.stream.Collectors.toList());
    }

    /** Per-team load = open tasks assigned to its members. */
    private List<AdminReportsDTO.TeamLoadDTO> teamLoad(List<Team> teams, List<Task> tasks) {
        List<AdminReportsDTO.TeamLoadDTO> out = new ArrayList<>();
        for (Team team : teams) {
            Set<Long> memberIds = new HashSet<>();
            if (team.getMembers() != null) team.getMembers().forEach(m -> memberIds.add(m.getId()));
            long open = tasks.stream()
                    .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED && t.getAssignedTo() != null)
                    .filter(t -> memberIds.contains(t.getAssignedTo().getId()))
                    .count();
            out.add(AdminReportsDTO.TeamLoadDTO.builder().equipe(team.getName()).charge(open).build());
        }
        out.sort(Comparator.comparingLong(AdminReportsDTO.TeamLoadDTO::getCharge).reversed());
        return out.size() > 6 ? out.subList(0, 6) : out;
    }

    /** Support tickets grouped by priority (the real categorical field). */
    private List<AdminReportsDTO.CategoryCountDTO> ticketsByPriority(List<SupportTicket> tickets) {
        Map<SupportTicket.Priority, String> labels = new LinkedHashMap<>();
        labels.put(SupportTicket.Priority.URGENT, "Urgente");
        labels.put(SupportTicket.Priority.HIGH, "Haute");
        labels.put(SupportTicket.Priority.MEDIUM, "Moyenne");
        labels.put(SupportTicket.Priority.LOW, "Faible");
        List<AdminReportsDTO.CategoryCountDTO> out = new ArrayList<>();
        labels.forEach((prio, label) -> {
            long count = tickets.stream().filter(t -> t.getPriority() == prio).count();
            if (count > 0) out.add(AdminReportsDTO.CategoryCountDTO.builder().name(label).value(count).build());
        });
        return out;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        String c = s.replace(".", "");
        return c.substring(0, 1).toUpperCase(FR) + c.substring(1);
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

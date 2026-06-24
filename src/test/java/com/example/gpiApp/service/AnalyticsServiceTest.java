package com.example.gpiApp.service;

import com.example.gpiApp.dto.analytics.ManagerAnalyticsDTO;
import com.example.gpiApp.dto.analytics.MemberWorkloadDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the manager analytics aggregation. Repositories are mocked — no database.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private TaskRepository taskRepository;
    @InjectMocks private AnalyticsService service;

    private Project project;

    @BeforeEach
    void setUp() {
        project = Project.builder().id(1L).name("Apollo").build();
    }

    private allUsers user(String first, String last) {
        return allUsers.builder().firstName(first).lastName(last).build();
    }

    private Task task(String name, Task.TaskStatus status, LocalDate deadline,
                      LocalDateTime createdAt, LocalDateTime updatedAt, allUsers assignee) {
        return Task.builder()
                .id((long) name.hashCode())
                .name(name)
                .status(status)
                .priority(Task.TaskPriority.MEDIUM)
                .progress(status == Task.TaskStatus.COMPLETED ? 100 : 30)
                .deadline(deadline)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .assignedTo(assignee)
                .build();
    }

    @Test
    @DisplayName("Computes on-time rate, avg completion, velocity and workload from the manager's tasks")
    void computesPortfolioMetrics() {
        allUsers alice = user("Alice", "Wu");
        allUsers bob = user("Bob", "Ngo");
        LocalDate today = LocalDate.now();

        List<Task> tasks = List.of(
                // finished before its deadline → on time; 5 days to complete
                task("a", Task.TaskStatus.COMPLETED, today.minusDays(4),
                        LocalDateTime.now().minusDays(10), LocalDateTime.now().minusDays(5), alice),
                // finished after its deadline → late; 9 days to complete
                task("b", Task.TaskStatus.COMPLETED, today.minusDays(3),
                        LocalDateTime.now().minusDays(10), LocalDateTime.now().minusDays(1), alice),
                // open task for Bob, not overdue
                task("c", Task.TaskStatus.IN_PROGRESS, today.plusDays(5),
                        LocalDateTime.now().minusDays(2), LocalDateTime.now().minusDays(2), bob)
        );

        when(projectRepository.findByManagerIdOrCreatedById(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(project)));
        when(taskRepository.findByProject(project)).thenReturn(tasks);

        ManagerAnalyticsDTO a = service.getManagerAnalytics(1L);

        assertThat(a.getTotalProjects()).isEqualTo(1);
        assertThat(a.getTotalTasks()).isEqualTo(3);
        assertThat(a.getCompletedTasks()).isEqualTo(2);
        assertThat(a.getOpenTasks()).isEqualTo(1);
        assertThat(a.getOverdueTasks()).isZero();
        assertThat(a.getOnTimeCompletionRate()).isEqualTo(50.0);   // 1 of 2 on time
        assertThat(a.getAvgCompletionDays()).isEqualTo(7.0);       // (5 + 9) / 2
        assertThat(a.getVelocityLast4Weeks()).isEqualTo(2);
        assertThat(a.getWeeklyTrend()).hasSize(8);

        // Workload: busiest (most open) first → Bob, then Alice.
        assertThat(a.getWorkloadByMember()).hasSize(2);
        MemberWorkloadDTO top = a.getWorkloadByMember().get(0);
        assertThat(top.getMemberName()).isEqualTo("Bob Ngo");
        assertThat(top.getOpenTasks()).isEqualTo(1);
        assertThat(a.getWorkloadByMember().get(1).getMemberName()).isEqualTo("Alice Wu");
        assertThat(a.getWorkloadByMember().get(1).getCompletedTasks()).isEqualTo(2);
    }

    @Test
    @DisplayName("Counts overdue open tasks (past deadline, not completed)")
    void countsOverdue() {
        LocalDate today = LocalDate.now();
        List<Task> tasks = List.of(
                task("late", Task.TaskStatus.IN_PROGRESS, today.minusDays(2),
                        LocalDateTime.now().minusDays(10), LocalDateTime.now().minusDays(2), user("Cara", "Lee")),
                task("fine", Task.TaskStatus.TODO, today.plusDays(10),
                        LocalDateTime.now().minusDays(1), LocalDateTime.now().minusDays(1), user("Cara", "Lee"))
        );
        when(projectRepository.findByManagerIdOrCreatedById(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(project)));
        when(taskRepository.findByProject(project)).thenReturn(tasks);

        ManagerAnalyticsDTO a = service.getManagerAnalytics(1L);

        assertThat(a.getOverdueTasks()).isEqualTo(1);
        assertThat(a.getOnTimeCompletionRate()).isZero(); // no completed tasks
    }

    @Test
    @DisplayName("A manager with no projects yields zeroed analytics with an 8-week trend skeleton")
    void noProjects() {
        when(projectRepository.findByManagerIdOrCreatedById(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ManagerAnalyticsDTO a = service.getManagerAnalytics(1L);

        assertThat(a.getTotalProjects()).isZero();
        assertThat(a.getTotalTasks()).isZero();
        assertThat(a.getOnTimeCompletionRate()).isZero();
        assertThat(a.getWeeklyTrend()).hasSize(8);
        assertThat(a.getWorkloadByMember()).isEmpty();
    }
}

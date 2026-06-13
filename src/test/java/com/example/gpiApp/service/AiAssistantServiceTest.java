package com.example.gpiApp.service;

import com.example.gpiApp.dto.ai.PrioritizationResultDTO;
import com.example.gpiApp.dto.ai.ProjectInsightDTO;
import com.example.gpiApp.dto.ai.RiskAssessmentDTO;
import com.example.gpiApp.dto.ai.TaskPrioritySuggestionDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the rule-based AI assistant engine.
 * Repositories are mocked, so these run fast with no database.
 */
@ExtendWith(MockitoExtension.class)
class AiAssistantServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private LangChainAiClient langChainClient;
    @InjectMocks private AiAssistantService service;

    private Project project;

    @BeforeEach
    void setUp() {
        project = Project.builder()
                .id(1L)
                .name("Apollo")
                .endDate(LocalDate.now().plusDays(30))
                .build();
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        // No AI sidecar in tests → assistant must use the rule-based engine (source = MOCK).
        lenient().when(langChainClient.isEnabled()).thenReturn(false);
    }

    private Task task(String name, Task.TaskStatus status, Task.TaskPriority priority,
                      int progress, LocalDate deadline) {
        return Task.builder()
                .id((long) name.hashCode())
                .name(name)
                .status(status)
                .priority(priority)
                .progress(progress)
                .deadline(deadline)
                .build();
    }

    private Task taskWithProgress(String name, Task.TaskStatus status, int progress,
                                  LocalDate deadline, LocalDateTime createdAt) {
        return Task.builder()
                .id((long) name.hashCode())
                .name(name)
                .status(status)
                .priority(Task.TaskPriority.MEDIUM)
                .progress(progress)
                .deadline(deadline)
                .createdAt(createdAt)
                .build();
    }

    @Test
    @DisplayName("Summary reports OFF_TRACK when a large share of tasks are overdue")
    void summaryFlagsOffTrack() {
        List<Task> tasks = List.of(
                task("a", Task.TaskStatus.TODO, Task.TaskPriority.HIGH, 0, LocalDate.now().minusDays(5)),
                task("b", Task.TaskStatus.IN_PROGRESS, Task.TaskPriority.MEDIUM, 20, LocalDate.now().minusDays(2)),
                task("c", Task.TaskStatus.COMPLETED, Task.TaskPriority.LOW, 100, LocalDate.now().minusDays(1))
        );
        when(taskRepository.findByProject(project)).thenReturn(tasks);

        ProjectInsightDTO insight = service.generateProjectSummary(1L);

        assertThat(insight.getHealthStatus()).isEqualTo("OFF_TRACK");
        assertThat(insight.getOverdueTasks()).isEqualTo(2L);
        assertThat(insight.getCompletedTasks()).isEqualTo(1L);
        assertThat(insight.getTotalTasks()).isEqualTo(3L);
        assertThat(insight.getSource()).isEqualTo("MOCK");
        assertThat(insight.getRecommendations()).isNotEmpty();
        assertThat(insight.getSummary()).contains("Apollo");
    }

    @Test
    @DisplayName("Summary reports ON_TRACK when work is progressing with no overdue tasks")
    void summaryHealthyProject() {
        List<Task> tasks = List.of(
                task("a", Task.TaskStatus.COMPLETED, Task.TaskPriority.MEDIUM, 100, LocalDate.now().minusDays(3)),
                task("b", Task.TaskStatus.COMPLETED, Task.TaskPriority.LOW, 100, LocalDate.now().minusDays(1)),
                task("c", Task.TaskStatus.IN_PROGRESS, Task.TaskPriority.MEDIUM, 60, LocalDate.now().plusDays(10))
        );
        when(taskRepository.findByProject(project)).thenReturn(tasks);

        ProjectInsightDTO insight = service.generateProjectSummary(1L);

        assertThat(insight.getHealthStatus()).isEqualTo("ON_TRACK");
        assertThat(insight.getOverdueTasks()).isZero();
        assertThat(insight.getCompletionRate()).isGreaterThan(60.0);
    }

    @Test
    @DisplayName("Prioritisation excludes completed tasks and ranks the most urgent first")
    void prioritiesRankByUrgency() {
        Task overdueCritical = task("overdue", Task.TaskStatus.TODO, Task.TaskPriority.CRITICAL, 0, LocalDate.now().minusDays(3));
        Task relaxedLow = task("relaxed", Task.TaskStatus.IN_PROGRESS, Task.TaskPriority.LOW, 90, LocalDate.now().plusDays(30));
        Task done = task("done", Task.TaskStatus.COMPLETED, Task.TaskPriority.HIGH, 100, LocalDate.now().minusDays(1));
        when(taskRepository.findByProject(project)).thenReturn(List.of(relaxedLow, done, overdueCritical));

        PrioritizationResultDTO result = service.suggestTaskPriorities(1L);

        // Completed task is excluded
        assertThat(result.getSuggestions()).hasSize(2);
        assertThat(result.getSuggestions())
                .noneMatch(s -> s.getTaskName().equals("done"));

        // Highest urgency first
        TaskPrioritySuggestionDTO top = result.getSuggestions().get(0);
        assertThat(top.getTaskName()).isEqualTo("overdue");
        assertThat(top.getUrgencyScore()).isGreaterThan(result.getSuggestions().get(1).getUrgencyScore());
        assertThat(top.getSuggestedPriority()).isEqualTo("CRITICAL");
        assertThat(top.getReason()).containsIgnoringCase("overdue");
        assertThat(result.getSource()).isEqualTo("MOCK");
    }

    @Test
    @DisplayName("Empty project is AT_RISK and yields no priority suggestions")
    void emptyProject() {
        when(taskRepository.findByProject(project)).thenReturn(List.of());

        assertThat(service.generateProjectSummary(1L).getHealthStatus()).isEqualTo("AT_RISK");
        assertThat(service.suggestTaskPriorities(1L).getSuggestions()).isEmpty();
    }

    @Test
    @DisplayName("Risk: an overdue open task is CRITICAL and drives the project risk")
    void riskFlagsOverdueTask() {
        List<Task> tasks = List.of(
                taskWithProgress("late", Task.TaskStatus.IN_PROGRESS, 40,
                        LocalDate.now().minusDays(5), LocalDateTime.now().minusDays(20)),
                taskWithProgress("done", Task.TaskStatus.COMPLETED, 100,
                        LocalDate.now().minusDays(1), LocalDateTime.now().minusDays(20))
        );
        when(taskRepository.findByProject(project)).thenReturn(tasks);

        RiskAssessmentDTO result = service.assessProjectRisks(1L);

        assertThat(result.getTotalOpenTasks()).isEqualTo(1);   // completed task excluded
        assertThat(result.getAtRiskCount()).isEqualTo(1);
        assertThat(result.getProjectRiskLevel()).isEqualTo("CRITICAL");
        assertThat(result.getRisks().get(0).getRiskLevel()).isEqualTo("CRITICAL");
        assertThat(result.getRisks().get(0).getReason()).containsIgnoringCase("overdue");
        assertThat(result.getSource()).isEqualTo("MOCK");
    }

    @Test
    @DisplayName("Risk: a steadily-progressing task on pace is LOW risk")
    void riskHealthyTask() {
        // 80% done over 10 days = 8%/day; 20% left finishes in ~3 days, deadline 20 days out.
        List<Task> tasks = List.of(
                taskWithProgress("ontrack", Task.TaskStatus.IN_PROGRESS, 80,
                        LocalDate.now().plusDays(20), LocalDateTime.now().minusDays(10))
        );
        when(taskRepository.findByProject(project)).thenReturn(tasks);

        RiskAssessmentDTO result = service.assessProjectRisks(1L);

        assertThat(result.getProjectRiskLevel()).isEqualTo("LOW");
        assertThat(result.getRisks().get(0).getRiskLevel()).isEqualTo("LOW");
        assertThat(result.getRisks().get(0).getPredictedSlipDays()).isZero();
        assertThat(result.getRisks().get(0).getPredictedCompletionDate()).isNotNull();
    }

    @Test
    @DisplayName("Risk: a slow task with a near deadline is predicted to slip")
    void riskSlippingTask() {
        // 20% done over 10 days = 2%/day; 80% left needs ~40 days but deadline is 5 days out.
        List<Task> tasks = List.of(
                taskWithProgress("slow", Task.TaskStatus.IN_PROGRESS, 20,
                        LocalDate.now().plusDays(5), LocalDateTime.now().minusDays(10))
        );
        when(taskRepository.findByProject(project)).thenReturn(tasks);

        RiskAssessmentDTO result = service.assessProjectRisks(1L);

        assertThat(result.getRisks().get(0).getPredictedSlipDays()).isGreaterThan(14);
        assertThat(result.getRisks().get(0).getRiskLevel()).isEqualTo("CRITICAL");
        assertThat(result.getProjectSlipDays()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Risk: a project with no open tasks is LOW risk")
    void riskEmptyProject() {
        when(taskRepository.findByProject(project)).thenReturn(List.of());

        RiskAssessmentDTO result = service.assessProjectRisks(1L);

        assertThat(result.getTotalOpenTasks()).isZero();
        assertThat(result.getAtRiskCount()).isZero();
        assertThat(result.getProjectRiskLevel()).isEqualTo("LOW");
    }
}

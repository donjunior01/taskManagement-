package com.example.gpiApp;

import com.example.gpiApp.dto.ImportResultDTO;
import com.example.gpiApp.dto.TrelloImportDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.service.ImportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImportServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock TaskRepository taskRepository;
    @InjectMocks ImportService service;

    private TrelloImportDTO.TrelloList list(String id, String name) {
        TrelloImportDTO.TrelloList l = new TrelloImportDTO.TrelloList();
        l.setId(id); l.setName(name);
        return l;
    }

    private TrelloImportDTO.TrelloCard card(String name, String idList, boolean closed, String due) {
        TrelloImportDTO.TrelloCard c = new TrelloImportDTO.TrelloCard();
        c.setName(name); c.setIdList(idList); c.setClosed(closed); c.setDue(due);
        return c;
    }

    @Test
    void importsCardsAsTasksWithMappedStatusesAndDueDates() {
        TrelloImportDTO board = new TrelloImportDTO();
        board.setName("Roadmap");
        board.setLists(List.of(list("L1", "To Do"), list("L2", "In Progress"), list("L3", "Done")));
        board.setCards(List.of(
                card("Spec it out", "L1", false, null),
                card("Build it", "L2", false, "2026-08-01T00:00:00.000Z"),
                card("Ship it", "L3", false, null),
                card("Archived card", "L1", true, null)   // closed → skipped
        ));

        when(projectRepository.save(any())).thenAnswer(a -> { Project p = a.getArgument(0); p.setId(50L); return p; });

        ImportResultDTO result = service.importTrello(board, null);

        assertEquals(50L, result.getProjectId());
        assertEquals("Roadmap", result.getProjectName());
        assertEquals(3, result.getTasksImported());
        assertEquals(1, result.getCardsSkipped());

        ArgumentCaptor<Task> tasks = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, times(3)).save(tasks.capture());
        List<Task> saved = tasks.getAllValues();
        assertEquals(Task.TaskStatus.TODO, saved.get(0).getStatus());
        assertEquals(Task.TaskStatus.IN_PROGRESS, saved.get(1).getStatus());
        assertEquals(LocalDate.of(2026, 8, 1), saved.get(1).getDeadline());
        assertEquals(Task.TaskStatus.COMPLETED, saved.get(2).getStatus());
    }

    @Test
    void rejectsNonTrelloPayload() {
        TrelloImportDTO empty = new TrelloImportDTO(); // no lists, no cards
        assertThrows(IllegalArgumentException.class, () -> service.importTrello(empty, null));
        verify(projectRepository, never()).save(any());
    }

    @Test
    void fallsBackToADefaultProjectNameWhenBoardHasNone() {
        TrelloImportDTO board = new TrelloImportDTO();
        board.setCards(List.of(card("Lone card", "X", false, null)));
        when(projectRepository.save(any())).thenAnswer(a -> { Project p = a.getArgument(0); p.setId(1L); return p; });

        ImportResultDTO result = service.importTrello(board, null);

        assertEquals("Imported Trello board", result.getProjectName());
        assertEquals(1, result.getTasksImported());
    }

    // ── Asana CSV ──

    @Test
    void csvParserHandlesQuotedCommasAndNewlines() {
        String csv = "Name,Notes\n\"Task, one\",\"line1\nline2\"\nTask two,\"he said \"\"hi\"\"\"\n";
        List<List<String>> rows = ImportService.parseCsv(csv);
        assertEquals(3, rows.size());
        assertEquals("Task, one", rows.get(1).get(0));
        assertEquals("line1\nline2", rows.get(1).get(1));
        assertEquals("he said \"hi\"", rows.get(2).get(1));
    }

    @Test
    void importsAsanaCsvMappingStatusFromSectionAndCompletedColumn() {
        String csv = "Name,Notes,Due Date,Section/Column,Completed At\n"
                + "Design,notes here,2026-08-01,To Do,\n"
                + "Develop,,,In Progress,\n"
                + "Release,,,Backlog,2026-07-01\n"     // Completed At set → COMPLETED regardless of section
                + ",,,,\n";                             // blank name → skipped
        when(projectRepository.save(any())).thenAnswer(a -> { Project p = a.getArgument(0); p.setId(9L); return p; });

        ImportResultDTO result = service.importAsana(csv, "Q3 Plan", null);

        assertEquals("Q3 Plan", result.getProjectName());
        assertEquals(3, result.getTasksImported());
        assertEquals(1, result.getCardsSkipped());
        assertEquals("asana", result.getSource());

        ArgumentCaptor<Task> tasks = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, times(3)).save(tasks.capture());
        List<Task> saved = tasks.getAllValues();
        assertEquals(Task.TaskStatus.TODO, saved.get(0).getStatus());
        assertEquals(LocalDate.of(2026, 8, 1), saved.get(0).getDeadline());
        assertEquals(Task.TaskStatus.IN_PROGRESS, saved.get(1).getStatus());
        assertEquals(Task.TaskStatus.COMPLETED, saved.get(2).getStatus());
    }

    @Test
    void asanaRejectsCsvWithoutNameColumn() {
        String csv = "Title,Notes\nfoo,bar\n";
        assertThrows(IllegalArgumentException.class, () -> service.importAsana(csv, "X", null));
        verify(projectRepository, never()).save(any());
    }

    // ── Jira CSV ──

    @Test
    void importsJiraCsvMappingStatusPriorityAndJiraDateFormat() {
        String csv = "Summary,Description,Status,Priority,Due Date\n"
                + "Login bug,users cannot log in,In Progress,Highest,15/Aug/26\n"
                + "Add search,,Done,Low,\n"
                + "Write docs,,To Do,Medium,2026-10-01\n"
                + ",,,,\n";                            // blank summary → skipped
        when(projectRepository.save(any())).thenAnswer(a -> { Project p = a.getArgument(0); p.setId(12L); return p; });

        ImportResultDTO result = service.importJira(csv, "Sprint 5", null);

        assertEquals("Sprint 5", result.getProjectName());
        assertEquals(3, result.getTasksImported());
        assertEquals(1, result.getCardsSkipped());
        assertEquals("jira", result.getSource());

        ArgumentCaptor<Task> tasks = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, times(3)).save(tasks.capture());
        List<Task> saved = tasks.getAllValues();
        assertEquals(Task.TaskStatus.IN_PROGRESS, saved.get(0).getStatus());
        assertEquals(Task.TaskPriority.CRITICAL, saved.get(0).getPriority());     // "Highest" → CRITICAL
        assertEquals(LocalDate.of(2026, 8, 15), saved.get(0).getDeadline());      // Jira dd/MMM/yy
        assertEquals(Task.TaskStatus.COMPLETED, saved.get(1).getStatus());
        assertEquals(Task.TaskPriority.LOW, saved.get(1).getPriority());
        assertEquals(Task.TaskStatus.TODO, saved.get(2).getStatus());
        assertEquals(LocalDate.of(2026, 10, 1), saved.get(2).getDeadline());      // ISO still works
    }

    @Test
    void jiraRejectsCsvWithoutSummaryColumn() {
        String csv = "Key,Status\nPROJ-1,Done\n";
        assertThrows(IllegalArgumentException.class, () -> service.importJira(csv, "X", null));
        verify(projectRepository, never()).save(any());
    }
}

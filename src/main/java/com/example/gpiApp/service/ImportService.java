package com.example.gpiApp.service;

import com.example.gpiApp.dto.ImportResultDTO;
import com.example.gpiApp.dto.TrelloImportDTO;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Migrates data from other tools into a new project. Currently: Trello board JSON. Runs in one
 * transaction (all-or-nothing) and is tenant-scoped — the TenantListener stamps the organization on
 * the new project and tasks from the caller's TenantContext.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImportService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public ImportResultDTO importTrello(TrelloImportDTO board, allUsers actor) {
        if (board == null || (board.getCards() == null && board.getLists() == null)) {
            throw new IllegalArgumentException("Not a recognizable Trello board export.");
        }

        String boardName = (board.getName() != null && !board.getName().isBlank())
                ? board.getName().trim() : "Imported Trello board";

        Project project = Project.builder()
                .name(boardName)
                .description("Imported from Trello.")
                .createdBy(actor)
                .manager(actor)
                .status(Project.ProjectStatus.ACTIVE)
                .progress(0)
                .archived(false)
                .build();
        Project savedProject = projectRepository.save(project); // TenantListener stamps the org

        Map<String, String> listNames = new HashMap<>();
        if (board.getLists() != null) {
            for (TrelloImportDTO.TrelloList l : board.getLists()) {
                if (l.getId() != null) listNames.put(l.getId(), l.getName());
            }
        }

        int imported = 0, skipped = 0;
        if (board.getCards() != null) {
            for (TrelloImportDTO.TrelloCard card : board.getCards()) {
                if (card.isClosed() || card.getName() == null || card.getName().isBlank()) { skipped++; continue; }
                Task task = Task.builder()
                        .name(card.getName().trim())
                        .description(card.getDesc())
                        .project(savedProject)
                        .createdBy(actor)
                        .status(mapStatus(listNames.get(card.getIdList())))
                        .deadline(parseDue(card.getDue()))
                        .priority(Task.TaskPriority.MEDIUM)
                        .progress(0)
                        .build();
                taskRepository.save(task);
                imported++;
            }
        }

        log.info("Trello import: project '{}' (id {}) with {} task(s), {} skipped.",
                boardName, savedProject.getId(), imported, skipped);
        return ImportResultDTO.builder()
                .projectId(savedProject.getId()).projectName(boardName)
                .tasksImported(imported).cardsSkipped(skipped).source("trello")
                .build();
    }

    /** Map a Trello list name to a task status by keyword; unknown lists → TODO. */
    private Task.TaskStatus mapStatus(String listName) {
        if (listName == null) return Task.TaskStatus.TODO;
        String l = listName.toLowerCase();
        if (l.contains("done") || l.contains("complete") || l.contains("termin") || l.contains("closed")) return Task.TaskStatus.COMPLETED;
        if (l.contains("progress") || l.contains("doing") || l.contains("cours") || l.contains("review")) return Task.TaskStatus.IN_PROGRESS;
        if (l.contains("hold") || l.contains("block") || l.contains("pause") || l.contains("attente")) return Task.TaskStatus.ON_HOLD;
        return Task.TaskStatus.TODO;
    }

    private static final String[] DATE_PATTERNS = {"d/MMM/yy", "d/MMM/yyyy", "dd/MMM/yy", "MM/dd/yyyy", "dd/MM/yyyy"};

    /** Parse a due date across the formats the supported tools emit (ISO first, then Jira dd/MMM/yy, etc.). */
    private LocalDate parseDue(String due) {
        if (due == null || due.isBlank()) return null;
        String s = due.trim();
        // ISO-8601 (Trello "2021-05-10T…", Asana "2026-09-15") — take the date portion.
        try {
            return LocalDate.parse(s.substring(0, Math.min(10, s.length())));
        } catch (Exception ignore) { /* try locale formats below */ }
        for (String pat : DATE_PATTERNS) {
            try {
                return LocalDate.parse(s, java.time.format.DateTimeFormatter.ofPattern(pat, java.util.Locale.ENGLISH));
            } catch (Exception ignore) { /* next */ }
        }
        return null;
    }

    // ── Jira CSV ──
    @Transactional
    public ImportResultDTO importJira(String csv, String projectName, allUsers actor) {
        List<List<String>> rows = parseCsv(csv);
        if (rows.size() < 2) throw new IllegalArgumentException("The CSV has no data rows.");

        List<String> header = rows.get(0);
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < header.size(); i++) idx.put(header.get(i).trim().toLowerCase(), i);

        int summaryCol = col(idx, "summary", "name");
        if (summaryCol < 0) throw new IllegalArgumentException("No 'Summary' column found — is this a Jira CSV export?");
        int descCol = col(idx, "description");
        int statusCol = col(idx, "status");
        int dueCol = col(idx, "due date", "due");
        int prioCol = col(idx, "priority");

        String name = (projectName != null && !projectName.isBlank()) ? projectName.trim() : "Imported Jira project";
        Project project = Project.builder()
                .name(name).description("Imported from Jira.")
                .createdBy(actor).manager(actor)
                .status(Project.ProjectStatus.ACTIVE).progress(0).archived(false)
                .build();
        Project savedProject = projectRepository.save(project);

        int imported = 0, skipped = 0;
        for (int r = 1; r < rows.size(); r++) {
            List<String> row = rows.get(r);
            String taskName = cell(row, summaryCol);
            if (taskName == null || taskName.isBlank()) { skipped++; continue; }
            Task task = Task.builder()
                    .name(taskName.trim()).description(cell(row, descCol))
                    .project(savedProject).createdBy(actor)
                    .status(mapStatus(cell(row, statusCol)))
                    .priority(mapPriority(cell(row, prioCol)))
                    .deadline(parseDue(cell(row, dueCol))).progress(0)
                    .build();
            taskRepository.save(task);
            imported++;
        }

        log.info("Jira import: project '{}' (id {}) with {} task(s), {} skipped.",
                name, savedProject.getId(), imported, skipped);
        return ImportResultDTO.builder()
                .projectId(savedProject.getId()).projectName(name)
                .tasksImported(imported).cardsSkipped(skipped).source("jira")
                .build();
    }

    /** Map a Jira priority name to our TaskPriority (Highest/Blocker→CRITICAL, High→HIGH, Low(est)→LOW). */
    private Task.TaskPriority mapPriority(String priority) {
        if (priority == null) return Task.TaskPriority.MEDIUM;
        String p = priority.toLowerCase();
        if (p.contains("highest") || p.contains("critical") || p.contains("blocker")) return Task.TaskPriority.CRITICAL;
        if (p.contains("high")) return Task.TaskPriority.HIGH;
        if (p.contains("low")) return Task.TaskPriority.LOW;
        return Task.TaskPriority.MEDIUM;
    }

    // ── Asana CSV ──
    @Transactional
    public ImportResultDTO importAsana(String csv, String projectName, allUsers actor) {
        List<List<String>> rows = parseCsv(csv);
        if (rows.size() < 2) throw new IllegalArgumentException("The CSV has no data rows.");

        List<String> header = rows.get(0);
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < header.size(); i++) idx.put(header.get(i).trim().toLowerCase(), i);

        int nameCol = col(idx, "name");
        if (nameCol < 0) throw new IllegalArgumentException("No 'Name' column found — is this an Asana CSV export?");
        int notesCol = col(idx, "notes");
        int dueCol = col(idx, "due date", "due");
        int sectionCol = col(idx, "section/column", "column", "section");
        int completedCol = col(idx, "completed at", "completed");

        String name = (projectName != null && !projectName.isBlank()) ? projectName.trim() : "Imported Asana project";
        Project project = Project.builder()
                .name(name).description("Imported from Asana.")
                .createdBy(actor).manager(actor)
                .status(Project.ProjectStatus.ACTIVE).progress(0).archived(false)
                .build();
        Project savedProject = projectRepository.save(project);

        int imported = 0, skipped = 0;
        for (int r = 1; r < rows.size(); r++) {
            List<String> row = rows.get(r);
            String taskName = cell(row, nameCol);
            if (taskName == null || taskName.isBlank()) { skipped++; continue; }
            String completed = cell(row, completedCol);
            Task.TaskStatus status = (completed != null && !completed.isBlank())
                    ? Task.TaskStatus.COMPLETED : mapStatus(cell(row, sectionCol));
            Task task = Task.builder()
                    .name(taskName.trim()).description(cell(row, notesCol))
                    .project(savedProject).createdBy(actor)
                    .status(status).deadline(parseDue(cell(row, dueCol)))
                    .priority(Task.TaskPriority.MEDIUM).progress(0)
                    .build();
            taskRepository.save(task);
            imported++;
        }

        log.info("Asana import: project '{}' (id {}) with {} task(s), {} skipped.",
                name, savedProject.getId(), imported, skipped);
        return ImportResultDTO.builder()
                .projectId(savedProject.getId()).projectName(name)
                .tasksImported(imported).cardsSkipped(skipped).source("asana")
                .build();
    }

    private static int col(Map<String, Integer> idx, String... aliases) {
        for (String a : aliases) {
            Integer i = idx.get(a);
            if (i != null) return i;
        }
        return -1;
    }

    private static String cell(List<String> row, int col) {
        return (col < 0 || col >= row.size()) ? null : row.get(col);
    }

    /** Minimal RFC-4180 CSV parser: handles quoted fields with embedded commas, newlines and "" escapes. */
    public static List<List<String>> parseCsv(String input) {
        List<List<String>> rows = new ArrayList<>();
        if (input == null || input.isEmpty()) return rows;
        List<String> current = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;
        int i = 0, n = input.length();
        while (i < n) {
            char c = input.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < n && input.charAt(i + 1) == '"') { field.append('"'); i++; }
                    else inQuotes = false;
                } else field.append(c);
            } else if (c == '"') {
                inQuotes = true;
            } else if (c == ',') {
                current.add(field.toString()); field.setLength(0);
            } else if (c == '\n' || c == '\r') {
                if (c == '\r' && i + 1 < n && input.charAt(i + 1) == '\n') i++;
                current.add(field.toString()); field.setLength(0);
                rows.add(current); current = new ArrayList<>();
            } else {
                field.append(c);
            }
            i++;
        }
        if (field.length() > 0 || !current.isEmpty()) { current.add(field.toString()); rows.add(current); }
        return rows;
    }
}

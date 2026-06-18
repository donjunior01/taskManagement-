package com.example.gpiApp.service;

import com.example.gpiApp.dto.report.MilestoneData;
import com.example.gpiApp.dto.report.ProjectHealthData;
import com.example.gpiApp.dto.report.TeamAllocationData;
import com.example.gpiApp.entity.Project;
import com.example.gpiApp.entity.Task;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.ProjectRepository;
import com.example.gpiApp.repository.TaskRepository;
import com.example.gpiApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SystemSettingsService systemSettingsService;

    /** Live, admin-configured application name used as the PDF company/brand name. */
    private String companyName() {
        try {
            String name = systemSettingsService.getSettings().getAppName();
            if (name != null && !name.isBlank()) return name.trim();
        } catch (Exception ignore) { /* fall back below */ }
        return "TaskMaster Pro";
    }

    // ── Existing reports ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generateTasksReport(Long projectId) throws JRException {
        List<Task> tasks = projectId != null
            ? taskRepository.findByProjectId(projectId, org.springframework.data.domain.Pageable.unpaged()).getContent()
            : taskRepository.findAll();

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(tasks);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", projectId != null ? "Tasks Report for Project" : "All Tasks Report");
        parameters.put("generatedBy", "Task Management System");
        parameters.put("COMPANY_NAME", companyName());
        parameters.put("COMPANY_TAGLINE", "Project & Task Management Platform");

        InputStream reportStream = getClass().getResourceAsStream("/reports/tasks_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    public byte[] generateProjectsReport() throws JRException {
        List<Project> projects = projectRepository.findAll();

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(projects);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Projects Report");
        parameters.put("generatedBy", "Task Management System");
        parameters.put("COMPANY_NAME", companyName());

        InputStream reportStream = getClass().getResourceAsStream("/reports/projects_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    public byte[] generateUsersReport() throws JRException {
        List<allUsers> users = userRepository.findAll();

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(users);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Users Report");
        parameters.put("generatedBy", "Task Management System");
        parameters.put("COMPANY_NAME", companyName());

        InputStream reportStream = getClass().getResourceAsStream("/reports/users_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    // ── New Jasper PDF reports ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generateProjectHealthReport() throws JRException {
        List<Project> projects = projectRepository.findAll();

        List<ProjectHealthData> data = projects.stream().map(project -> {
            // Use explicit repository query to avoid lazy-loading project.getTasks()
            List<Task> tasks = taskRepository.findByProject(project);
            int totalTasks = tasks.size();
            int completedTasks = (int) tasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED).count();
            int pendingTasks = totalTasks - completedTasks;

            return new ProjectHealthData(
                project.getName(),
                project.getStatus() != null ? project.getStatus().name() : "PLANNED",
                project.getProgress() != null ? project.getProgress() : 0,
                totalTasks,
                completedTasks,
                pendingTasks,
                project.getStartDate() != null ? project.getStartDate().toString() : "N/A",
                project.getEndDate() != null ? project.getEndDate().toString() : "N/A"
            );
        }).collect(Collectors.toList());

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Project Health Report");
        parameters.put("generatedBy", "Task Management System");
        parameters.put("COMPANY_NAME", companyName());

        InputStream reportStream = getClass().getResourceAsStream("/reports/project_health_report.jrxml");
        if (reportStream == null) throw new IllegalStateException("JRXML not found: project_health_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] generateTeamAllocationReport() throws JRException {
        List<allUsers> users = userRepository.findAll();
        List<Task> allTasks = taskRepository.findAll();

        Map<Long, List<Task>> tasksByUser = allTasks.stream()
            .filter(t -> t.getAssignedTo() != null)
            .collect(Collectors.groupingBy(t -> t.getAssignedTo().getId()));

        List<TeamAllocationData> data = users.stream().map(user -> {
            List<Task> userTasks = tasksByUser.getOrDefault(user.getId(), List.of());
            int tasksAssigned = userTasks.size();
            int tasksCompleted = taskRepository.countByAssignedToIdAndStatus(
                user.getId(), Task.TaskStatus.COMPLETED).intValue();
            // Count distinct project IDs from the already-loaded task list
            // The project FK (project_id) is accessible on the task row without loading the Project proxy
            int projectsCount = (int) userTasks.stream()
                .filter(t -> t.getProject() != null)
                .map(t -> t.getProject().getId())
                .distinct().count();

            return new TeamAllocationData(
                user.getFirstName() + " " + user.getLastName(),
                user.getUsername(),
                user.getRole().name(),
                user.getEmail(),
                tasksAssigned,
                tasksCompleted,
                projectsCount
            );
        }).collect(Collectors.toList());

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Team Allocation Report");
        parameters.put("generatedBy", "Task Management System");
        parameters.put("COMPANY_NAME", companyName());

        InputStream reportStream = getClass().getResourceAsStream("/reports/team_allocation_report.jrxml");
        if (reportStream == null) throw new IllegalStateException("JRXML not found: team_allocation_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] generateMilestoneDeliveryReport() throws JRException {
        List<Task> tasks = taskRepository.findAll();

        List<MilestoneData> data = tasks.stream().map(task -> {
            String assigneeName = task.getAssignedTo() != null
                ? task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName()
                : "Unassigned";
            String projectName = task.getProject() != null ? task.getProject().getName() : "N/A";

            return new MilestoneData(
                task.getName(),
                projectName,
                assigneeName,
                task.getPriority() != null ? task.getPriority().name() : "MEDIUM",
                task.getStatus() != null ? task.getStatus().name() : "PLANNED",
                task.getDeadline() != null ? task.getDeadline().toString() : "N/A",
                task.getProgress() != null ? task.getProgress() : 0
            );
        }).collect(Collectors.toList());

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("title", "Milestone Delivery Report");
        parameters.put("generatedBy", "Task Management System");
        parameters.put("COMPANY_NAME", companyName());

        InputStream reportStream = getClass().getResourceAsStream("/reports/milestone_delivery_report.jrxml");
        if (reportStream == null) throw new IllegalStateException("JRXML not found: milestone_delivery_report.jrxml");
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
        return outputStream.toByteArray();
    }

    // ── CSV exports ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String generateTasksCsv() {
        List<Task> tasks = taskRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("Task Name,Status,Priority,Progress,Deadline,Project,Assignee\n");
        for (Task task : tasks) {
            String projectName = task.getProject() != null ? task.getProject().getName() : "";
            String assignee = task.getAssignedTo() != null
                ? task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName()
                : "";
            sb.append(escapeCsv(task.getName())).append(",")
              .append(task.getStatus()).append(",")
              .append(task.getPriority()).append(",")
              .append(task.getProgress() != null ? task.getProgress() : 0).append(",")
              .append(task.getDeadline() != null ? task.getDeadline().toString() : "").append(",")
              .append(escapeCsv(projectName)).append(",")
              .append(escapeCsv(assignee)).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String generateProjectsCsv() {
        List<Project> projects = projectRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("Project Name,Status,Progress,Start Date,End Date,Total Tasks,Completed Tasks\n");
        for (Project project : projects) {
            List<Task> tasks = project.getTasks();
            int totalTasks = tasks.size();
            int completedTasks = (int) tasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED).count();
            sb.append(escapeCsv(project.getName())).append(",")
              .append(project.getStatus()).append(",")
              .append(project.getProgress() != null ? project.getProgress() : 0).append(",")
              .append(project.getStartDate() != null ? project.getStartDate().toString() : "").append(",")
              .append(project.getEndDate() != null ? project.getEndDate().toString() : "").append(",")
              .append(totalTasks).append(",")
              .append(completedTasks).append("\n");
        }
        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

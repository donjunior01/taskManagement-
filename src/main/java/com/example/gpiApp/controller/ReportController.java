package com.example.gpiApp.controller;

import com.example.gpiApp.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import net.sf.jasperreports.engine.JRException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Report generation endpoints using Jasper Reports")
public class ReportController {

    private final ReportService reportService;

    // ── Existing endpoints ──────────────────────────────────────────────────

    @GetMapping("/tasks/pdf")
    @Operation(summary = "Generate tasks report as PDF")
    public ResponseEntity<byte[]> generateTasksReport(
            @Parameter(description = "Project ID (optional)")
            @RequestParam(required = false) Long projectId) {
        try {
            byte[] report = reportService.generateTasksReport(projectId);
            return pdfResponse(report, "tasks_report.pdf");
        } catch (JRException e) {
            log.error("Error generating tasks report", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/projects/pdf")
    @Operation(summary = "Generate projects report as PDF")
    public ResponseEntity<byte[]> generateProjectsReport() {
        try {
            byte[] report = reportService.generateProjectsReport();
            return pdfResponse(report, "projects_report.pdf");
        } catch (JRException e) {
            log.error("Error generating projects report", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/users/pdf")
    @Operation(summary = "Generate users report as PDF")
    public ResponseEntity<byte[]> generateUsersReport() {
        try {
            byte[] report = reportService.generateUsersReport();
            return pdfResponse(report, "users_report.pdf");
        } catch (JRException e) {
            log.error("Error generating users report", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── New Jasper PDF endpoints ─────────────────────────────────────────────

    @GetMapping("/project-health/pdf")
    @Operation(summary = "Generate project health report as PDF")
    public ResponseEntity<byte[]> generateProjectHealthReport() {
        try {
            byte[] report = reportService.generateProjectHealthReport();
            return pdfResponse(report, "project_health_report.pdf");
        } catch (Exception e) {
            log.error("Error generating project health report: {}", e.getMessage(), e);
            String msg = e.getClass().getSimpleName() + ": " + e.getMessage();
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(msg.getBytes(StandardCharsets.UTF_8));
        }
    }

    @GetMapping("/team-allocation/pdf")
    @Operation(summary = "Generate team allocation report as PDF")
    public ResponseEntity<byte[]> generateTeamAllocationReport() {
        try {
            byte[] report = reportService.generateTeamAllocationReport();
            return pdfResponse(report, "team_allocation_report.pdf");
        } catch (Exception e) {
            log.error("Error generating team allocation report: {}", e.getMessage(), e);
            String msg = e.getClass().getSimpleName() + ": " + e.getMessage();
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(msg.getBytes(StandardCharsets.UTF_8));
        }
    }

    @GetMapping("/milestone-delivery/pdf")
    @Operation(summary = "Generate milestone delivery report as PDF")
    public ResponseEntity<byte[]> generateMilestoneDeliveryReport() {
        try {
            byte[] report = reportService.generateMilestoneDeliveryReport();
            return pdfResponse(report, "milestone_delivery_report.pdf");
        } catch (Exception e) {
            log.error("Error generating milestone delivery report: {}", e.getMessage(), e);
            String msg = e.getClass().getSimpleName() + ": " + e.getMessage();
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(msg.getBytes(StandardCharsets.UTF_8));
        }
    }

    // ── CSV endpoints ────────────────────────────────────────────────────────

    @GetMapping("/tasks/csv")
    @Operation(summary = "Export all tasks as CSV")
    public ResponseEntity<byte[]> exportTasksCsv() {
        String csv = reportService.generateTasksCsv();
        return csvResponse(csv, "tasks_export.csv");
    }

    @GetMapping("/projects/csv")
    @Operation(summary = "Export all projects as CSV")
    public ResponseEntity<byte[]> exportProjectsCsv() {
        String csv = reportService.generateProjectsCsv();
        return csvResponse(csv, "projects_export.csv");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ResponseEntity<byte[]> pdfResponse(byte[] data, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(data);
    }

    private ResponseEntity<byte[]> csvResponse(String csv, String filename) {
        byte[] data = csv.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(data);
    }

    private static final org.slf4j.Logger log =
        org.slf4j.LoggerFactory.getLogger(ReportController.class);
}

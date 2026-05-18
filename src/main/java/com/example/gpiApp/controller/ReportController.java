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

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Report generation endpoints using Jasper Reports")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/tasks/pdf")
    @Operation(summary = "Generate tasks report as PDF", description = "Generate a PDF report of all tasks or tasks for a specific project")
    public ResponseEntity<byte[]> generateTasksReport(
            @Parameter(description = "Project ID (optional, if not provided generates report for all tasks)")
            @RequestParam(required = false) Long projectId) {
        try {
            byte[] report = reportService.generateTasksReport(projectId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "tasks_report.pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
        } catch (JRException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/projects/pdf")
    @Operation(summary = "Generate projects report as PDF", description = "Generate a PDF report of all projects")
    public ResponseEntity<byte[]> generateProjectsReport() {
        try {
            byte[] report = reportService.generateProjectsReport();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "projects_report.pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
        } catch (JRException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/users/pdf")
    @Operation(summary = "Generate users report as PDF", description = "Generate a PDF report of all users")
    public ResponseEntity<byte[]> generateUsersReport() {
        try {
            byte[] report = reportService.generateUsersReport();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "users_report.pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
        } catch (JRException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

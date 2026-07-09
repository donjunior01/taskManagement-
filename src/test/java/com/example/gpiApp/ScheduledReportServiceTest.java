package com.example.gpiApp;

import com.example.gpiApp.entity.ScheduledReport;
import com.example.gpiApp.repository.ScheduledReportRepository;
import com.example.gpiApp.service.EmailService;
import com.example.gpiApp.service.ReportService;
import com.example.gpiApp.service.ScheduledReportService;
import com.example.gpiApp.config.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduledReportServiceTest {

    @Mock ScheduledReportRepository repository;
    @Mock ReportService reportService;
    @Mock EmailService emailService;
    @InjectMocks ScheduledReportService service;

    @AfterEach
    void resetTenant() { TenantContext.clear(); }

    private ScheduledReport report(String type, String freq, String recipients, LocalDate lastRun) {
        return ScheduledReport.builder()
                .id(1L).organizationId(1L).name("Report").reportType(type)
                .frequency(freq).recipients(recipients).enabled(true).lastRunOn(lastRun).build();
    }

    @Test
    void runDueSendsDailyReportToEveryRecipient() {
        ScheduledReport r = report("tasks-csv", "DAILY", "a@x.com, b@x.com", null);
        when(repository.findByEnabledTrue()).thenReturn(List.of(r));
        when(reportService.generateTasksCsv()).thenReturn("Task Name,Status\nA,TODO\n");

        int sent = service.runDue();

        assertEquals(2, sent);
        verify(reportService).generateTasksCsv();
        verify(emailService, times(2)).sendReport(anyString(), anyString(), anyString(), anyString(), any());
        assertEquals(LocalDate.now(), r.getLastRunOn());
        verify(repository).save(r);
    }

    @Test
    void runDueSkipsReportAlreadySentToday() {
        ScheduledReport r = report("tasks-csv", "DAILY", "a@x.com", LocalDate.now());
        when(repository.findByEnabledTrue()).thenReturn(List.of(r));

        int sent = service.runDue();

        assertEquals(0, sent);
        verifyNoInteractions(reportService, emailService);
    }

    @Test
    void sendNowIgnoresCadenceAndUsesTheRightGenerator() {
        ScheduledReport r = report("projects-csv", "MONTHLY", "one@x.com", LocalDate.now());
        when(repository.findById(1L)).thenReturn(Optional.of(r));
        when(reportService.generateProjectsCsv()).thenReturn("Project Name\nApollo\n");

        int sent = service.sendNow(1L);

        assertEquals(1, sent);
        verify(reportService).generateProjectsCsv();
        verify(emailService).sendReport(eq("one@x.com"), anyString(), anyString(), contains("projects-csv"), any());
    }

    @Test
    void createRejectsUnknownReportType() {
        ScheduledReport bad = ScheduledReport.builder()
                .name("x").reportType("nope").frequency("DAILY").recipients("a@x.com").build();
        assertThrows(IllegalArgumentException.class, () -> service.create(bad));
        verify(repository, never()).save(any());
    }
}

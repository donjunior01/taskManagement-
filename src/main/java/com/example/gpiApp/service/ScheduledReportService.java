package com.example.gpiApp.service;

import com.example.gpiApp.config.security.TenantContext;
import com.example.gpiApp.entity.ScheduledReport;
import com.example.gpiApp.repository.ScheduledReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * CRUD + execution for scheduled report exports. CRUD is tenant-scoped by the @Filter. Execution
 * ({@link #runDue()} / {@link #sendNow(Long)}) generates the CSV for the report's org — the
 * TenantContext is set to that org so ReportService's queries are correctly scoped — and emails it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledReportService {

    private static final Set<String> TYPES = Set.of("tasks-csv", "projects-csv");
    private static final Set<String> FREQS = Set.of("DAILY", "WEEKLY", "MONTHLY");

    private final ScheduledReportRepository repository;
    private final ReportService reportService;
    private final EmailService emailService;

    // ── CRUD (tenant-scoped) ──
    @Transactional(readOnly = true)
    public List<ScheduledReport> list() {
        return repository.findByOrderByCreatedAtDesc();
    }

    @Transactional
    public ScheduledReport create(ScheduledReport r) {
        r.setId(null);
        validate(r);
        return repository.save(r); // TenantListener stamps the org
    }

    @Transactional
    public ScheduledReport update(Long id, ScheduledReport patch) {
        ScheduledReport r = getOwned(id);
        if (patch.getName() != null) r.setName(patch.getName());
        if (patch.getReportType() != null) r.setReportType(patch.getReportType());
        if (patch.getFrequency() != null) r.setFrequency(patch.getFrequency());
        if (patch.getRecipients() != null) r.setRecipients(patch.getRecipients());
        r.setEnabled(patch.isEnabled());
        validate(r);
        return repository.save(r);
    }

    @Transactional
    public void delete(Long id) { repository.delete(getOwned(id)); }

    // ── Execution ──
    /** Run every enabled schedule that is due today. @return number of report emails dispatched. */
    public int runDue() {
        LocalDate today = LocalDate.now();
        int sent = 0;
        for (ScheduledReport r : repository.findByEnabledTrue()) {
            if (!isDue(r, today)) continue;
            sent += execute(r, today);
        }
        return sent;
    }

    /** Send one schedule immediately, ignoring the cadence (used by the "send now" action). */
    @Transactional
    public int sendNow(Long id) {
        ScheduledReport r = getOwned(id);
        return execute(r, LocalDate.now());
    }

    private int execute(ScheduledReport r, LocalDate today) {
        Long previous = TenantContext.getOrganizationId();
        int sent = 0;
        try {
            TenantContext.setOrganizationId(r.getOrganizationId());
            String csv = "projects-csv".equals(r.getReportType())
                    ? reportService.generateProjectsCsv()
                    : reportService.generateTasksCsv();
            byte[] bytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            String filename = r.getReportType() + "-" + today + ".csv";
            String subject = "Scheduled report: " + r.getName();
            String body = "Attached is your scheduled report \"" + r.getName() + "\" (" + r.getReportType()
                    + ", " + r.getFrequency().toLowerCase() + ") generated on " + today + ".";
            for (String to : r.getRecipients().split("[,;\\s]+")) {
                if (to != null && !to.isBlank()) {
                    emailService.sendReport(to.trim(), subject, body, filename, bytes);
                    sent++;
                }
            }
            r.setLastRunOn(today);
            repository.save(r);
        } catch (Exception e) {
            log.warn("Scheduled report {} failed: {}", r.getId(), e.getMessage());
        } finally {
            if (previous != null) TenantContext.setOrganizationId(previous); else TenantContext.clear();
        }
        return sent;
    }

    private boolean isDue(ScheduledReport r, LocalDate today) {
        if (today.equals(r.getLastRunOn())) return false; // already sent today
        switch (r.getFrequency() == null ? "" : r.getFrequency().toUpperCase()) {
            case "DAILY":   return true;
            case "WEEKLY":  return today.getDayOfWeek() == java.time.DayOfWeek.MONDAY;
            case "MONTHLY": return today.getDayOfMonth() == 1;
            default:        return false;
        }
    }

    private void validate(ScheduledReport r) {
        if (r.getName() == null || r.getName().isBlank()) throw new IllegalArgumentException("Report name is required.");
        if (!TYPES.contains(r.getReportType())) throw new IllegalArgumentException("Unknown report type.");
        if (r.getFrequency() == null || !FREQS.contains(r.getFrequency().toUpperCase()))
            throw new IllegalArgumentException("Unknown frequency.");
        if (r.getRecipients() == null || r.getRecipients().isBlank())
            throw new IllegalArgumentException("At least one recipient is required.");
        r.setFrequency(r.getFrequency().toUpperCase());
    }

    private ScheduledReport getOwned(Long id) {
        ScheduledReport r = repository.findById(id).orElseThrow(() -> new AccessDeniedException("Report not found"));
        Long org = TenantContext.getOrganizationId();
        if (org != null && r.getOrganizationId() != null && !org.equals(r.getOrganizationId()))
            throw new AccessDeniedException("This report belongs to another organization.");
        return r;
    }
}

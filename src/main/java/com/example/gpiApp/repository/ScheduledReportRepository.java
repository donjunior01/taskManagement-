package com.example.gpiApp.repository;

import com.example.gpiApp.entity.ScheduledReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduledReportRepository extends JpaRepository<ScheduledReport, Long> {

    /** Tenant-scoped listing (the org @Filter narrows this to the caller's organization). */
    List<ScheduledReport> findByOrderByCreatedAtDesc();

    /** All enabled schedules across orgs — used by the scheduler (no TenantContext → filter inert). */
    List<ScheduledReport> findByEnabledTrue();
}

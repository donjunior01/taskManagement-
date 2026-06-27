package com.example.gpiApp.repository;

import com.example.gpiApp.entity.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowStatusRepository extends JpaRepository<WorkflowStatus, Long> {
    List<WorkflowStatus> findByOrganizationIdOrderByDisplayOrderAscIdAsc(Long organizationId);
    List<WorkflowStatus> findByOrganizationIdAndActiveTrueOrderByDisplayOrderAscIdAsc(Long organizationId);
}

package com.example.gpiApp.repository;

import com.example.gpiApp.entity.TaskTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskTemplateRepository extends JpaRepository<TaskTemplate, Long> {
    List<TaskTemplate> findByOrganizationIdOrderByNameAsc(Long organizationId);
    List<TaskTemplate> findByOrganizationIdAndActiveTrueOrderByNameAsc(Long organizationId);
}

package com.example.gpiApp.repository;

import com.example.gpiApp.entity.CustomFieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomFieldDefinitionRepository extends JpaRepository<CustomFieldDefinition, Long> {
    List<CustomFieldDefinition> findByOrganizationIdOrderByDisplayOrderAscIdAsc(Long organizationId);
    List<CustomFieldDefinition> findByOrganizationIdAndActiveTrueOrderByDisplayOrderAscIdAsc(Long organizationId);
}

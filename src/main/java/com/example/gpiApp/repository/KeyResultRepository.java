package com.example.gpiApp.repository;

import com.example.gpiApp.entity.KeyResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KeyResultRepository extends JpaRepository<KeyResult, Long> {
    List<KeyResult> findByObjectiveIdOrderByIdAsc(Long objectiveId);
    List<KeyResult> findByOrganizationIdOrderByIdAsc(Long organizationId);
    void deleteByObjectiveId(Long objectiveId);
}

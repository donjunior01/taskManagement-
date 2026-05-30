package com.example.gpiApp.repository;

import com.example.gpiApp.entity.ChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {

    List<ChecklistItem> findByTaskIdOrderByPositionAscIdAsc(Long taskId);

    long countByTaskId(Long taskId);

    long countByTaskIdAndCompletedTrue(Long taskId);
}

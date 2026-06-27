package com.example.gpiApp.repository;

import com.example.gpiApp.entity.WikiPage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WikiPageRepository extends JpaRepository<WikiPage, Long> {
    List<WikiPage> findByOrganizationIdOrderByTitleAsc(Long organizationId);
    List<WikiPage> findByOrganizationIdAndParentId(Long organizationId, Long parentId);
}

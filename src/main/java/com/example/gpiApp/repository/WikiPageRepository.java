package com.example.gpiApp.repository;

import com.example.gpiApp.entity.WikiPage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WikiPageRepository extends JpaRepository<WikiPage, Long> {
    List<WikiPage> findByOrganizationIdOrderByTitleAsc(Long organizationId);
    List<WikiPage> findByOrganizationIdAndParentId(Long organizationId, Long parentId);

    // Full-text-ish search over title + Markdown body (org scoping applied by the tenant @Filter).
    @Query("SELECT w FROM WikiPage w WHERE w.title LIKE %:keyword% OR w.content LIKE %:keyword%")
    Page<WikiPage> searchWikiPages(@Param("keyword") String keyword, Pageable pageable);
}

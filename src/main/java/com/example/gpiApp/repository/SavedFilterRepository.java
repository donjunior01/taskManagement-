package com.example.gpiApp.repository;

import com.example.gpiApp.entity.SavedFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedFilterRepository extends JpaRepository<SavedFilter, Long> {

    /** A user's own filters for a resource, plus any shared by others in the org (tenant @Filter scopes the org). */
    @Query("SELECT f FROM SavedFilter f WHERE f.resource = :resource AND (f.userId = :userId OR f.shared = true) "
            + "ORDER BY f.name ASC")
    List<SavedFilter> findVisible(@Param("userId") Long userId, @Param("resource") String resource);
}

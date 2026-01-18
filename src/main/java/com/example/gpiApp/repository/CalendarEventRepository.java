package com.example.gpiApp.repository;

import com.example.gpiApp.entity.CalendarEvent;
import com.example.gpiApp.entity.allUsers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByUserId(Long userId);

    Page<CalendarEvent> findByUserId(Long userId, Pageable pageable);

    List<CalendarEvent> findByEntityTypeAndEntityId(String entityType, Long entityId);

    Optional<CalendarEvent> findByGoogleEventId(String googleEventId);

    @Query("SELECT ce FROM CalendarEvent ce WHERE ce.user.id = :userId AND ce.startTime >= :startDate AND ce.endTime <= :endDate ORDER BY ce.startTime ASC")
    List<CalendarEvent> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT ce FROM CalendarEvent ce WHERE ce.startTime >= :startDate AND ce.endTime <= :endDate ORDER BY ce.startTime ASC")
    List<CalendarEvent> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<CalendarEvent> findByEventType(CalendarEvent.EventType eventType);

    @Query("SELECT ce FROM CalendarEvent ce WHERE ce.isSynced = false")
    List<CalendarEvent> findUnsyncedEvents();

    @Query("SELECT ce FROM CalendarEvent ce WHERE ce.user.id = :userId AND ce.startTime >= :now ORDER BY ce.startTime ASC")
    List<CalendarEvent> findUpcomingEventsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    void deleteByEntityTypeAndEntityId(String entityType, Long entityId);
    
    // New methods for calendar redesign
    List<CalendarEvent> findByUserOrderByStartTimeAsc(allUsers user);
    
    Page<CalendarEvent> findByUserAndStartTimeGreaterThanOrderByStartTimeAsc(allUsers user, LocalDateTime startTime, Pageable pageable);
    
    List<CalendarEvent> findByUserAndStartTimeGreaterThanEqualAndEndTimeLessThanEqualOrderByStartTimeAsc(
            allUsers user, LocalDateTime startTime, LocalDateTime endTime);
    
    List<CalendarEvent> findByUserAndTitleContainingIgnoreCase(allUsers user, String title);
}


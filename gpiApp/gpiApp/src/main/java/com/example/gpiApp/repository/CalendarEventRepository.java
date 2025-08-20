package com.example.gpiApp.repository;

import com.example.gpiApp.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    
    /**
     * Find all events for a specific user
     */
    List<CalendarEvent> findByUsername(String username);
    
    /**
     * Find events for a user within a date range
     */
    List<CalendarEvent> findByUsernameAndStartTimeBetween(String username, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Find events by type for a specific user
     */
    List<CalendarEvent> findByUsernameAndEventType(String username, String eventType);
    
    /**
     * Find events by username and status
     */
    List<CalendarEvent> findByUsernameAndStatus(String username, String status);
    
    /**
     * Find upcoming events for a user
     */
    @Query("SELECT e FROM CalendarEvent e WHERE e.username = :username AND e.startTime >= :startTime ORDER BY e.startTime ASC")
    List<CalendarEvent> findUpcomingEvents(@Param("username") String username, @Param("startTime") LocalDateTime startTime);
    
    /**
     * Find events linked to a specific task
     */
    List<CalendarEvent> findByTaskId(Long taskId);
    
    /**
     * Find events linked to a specific project
     */
    List<CalendarEvent> findByProjectId(Long projectId);
    
    /**
     * Find events by priority for a user
     */
    List<CalendarEvent> findByUsernameAndPriorityOrderByStartTimeAsc(String username, String priority);
    
    /**
     * Find recurring events for a user
     */
    List<CalendarEvent> findByUsernameAndRecurrenceIsNotNull(String username);
    
    /**
     * Find all-day events for a user
     */
    List<CalendarEvent> findByUsernameAndAllDayTrue(String username);
    
    /**
     * Find events by location for a user
     */
    List<CalendarEvent> findByUsernameAndLocationContainingIgnoreCase(String username, String location);
    
    /**
     * Find events by title containing text for a user
     */
    List<CalendarEvent> findByUsernameAndTitleContainingIgnoreCase(String username, String title);
    
    /**
     * Find events by description containing text for a user
     */
    List<CalendarEvent> findByUsernameAndDescriptionContainingIgnoreCase(String username, String description);
    
    /**
     * Count events by type for a user
     */
    long countByUsernameAndEventType(String username, String eventType);
    
    /**
     * Count events by status for a user
     */
    long countByUsernameAndStatus(String username, String status);
    
    /**
     * Find events that overlap with a given time range
     */
    @Query("SELECT e FROM CalendarEvent e WHERE e.username = :username AND " +
           "((e.startTime <= :startTime AND e.endTime >= :startTime) OR " +
           "(e.startTime <= :endTime AND e.endTime >= :endTime) OR " +
           "(e.startTime >= :startTime AND e.endTime <= :endTime))")
    List<CalendarEvent> findOverlappingEvents(@Param("username") String username, 
                                            @Param("startTime") LocalDateTime startTime, 
                                            @Param("endTime") LocalDateTime endTime);
}


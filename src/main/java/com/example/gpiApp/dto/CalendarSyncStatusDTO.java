package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reports whether Google Calendar sync is configured and how many of the user's
 * events are currently synced.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarSyncStatusDTO {
    private boolean enabled;        // Google Calendar integration configured & available
    private String calendarId;      // target calendar (e.g. "primary")
    private long totalEvents;
    private long syncedEvents;
    private long unsyncedEvents;
}

package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Outcome of a bulk Google Calendar sync (push of local events and/or import of remote ones).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarSyncResultDTO {
    private boolean enabled;   // false when Google Calendar is not configured
    private int pushed;        // local events newly sent to Google
    private int imported;      // Google events newly saved locally
    private int skipped;       // already-synced / already-present, nothing to do
    private int failed;        // operations that errored
    private String message;
}

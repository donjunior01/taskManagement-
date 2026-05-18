package com.example.gpiApp.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Slf4j
@Configuration
public class GoogleCalendarConfig {

    private static final String APPLICATION_NAME = "Task Management System";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    @Value("${google.calendar.credentials.file:#{null}}")
    private Resource credentialsFile;

    @Value("${google.calendar.enabled:false}")
    private boolean calendarEnabled;

    @Value("${google.calendar.id:primary}")
    private String defaultCalendarId;

    @Bean
    public Calendar googleCalendarService() {
        if (!calendarEnabled) {
            log.info("Google Calendar integration is disabled");
            return null;
        }

        if (credentialsFile == null || !credentialsFile.exists()) {
            log.warn("Google Calendar credentials file not found. Calendar integration will be disabled.");
            return null;
        }

        try {
            HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            
            GoogleCredentials credentials = ServiceAccountCredentials
                    .fromStream(credentialsFile.getInputStream())
                    .createScoped(Collections.singleton(CalendarScopes.CALENDAR));

            Calendar calendar = new Calendar.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                    .setApplicationName(APPLICATION_NAME)
                    .build();

            log.info("Google Calendar service initialized successfully");
            return calendar;
        } catch (IOException | GeneralSecurityException e) {
            log.error("Failed to initialize Google Calendar service: {}", e.getMessage());
            return null;
        }
    }

    public boolean isCalendarEnabled() {
        return calendarEnabled;
    }

    public String getDefaultCalendarId() {
        return defaultCalendarId;
    }
}

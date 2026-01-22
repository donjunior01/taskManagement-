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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Configuration
public class GoogleCalendarConfig {

    private static final String APPLICATION_NAME = "Task Management System";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    @Value("${google.calendar.credentials.file:#{null}}")
    private Resource credentialsFile;

    @Value("${google.calendar.enabled:false}")
    private boolean calendarEnabled;

    @Bean
    public Calendar googleCalendarService() throws GeneralSecurityException, IOException {
        if (!calendarEnabled || credentialsFile == null || !credentialsFile.exists()) {
            return null;
        }

        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        
        GoogleCredentials credentials = ServiceAccountCredentials
                .fromStream(credentialsFile.getInputStream())
                .createScoped(Collections.singleton(CalendarScopes.CALENDAR));

        return new Calendar.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    public boolean isCalendarEnabled() {
        return calendarEnabled;
    }
}


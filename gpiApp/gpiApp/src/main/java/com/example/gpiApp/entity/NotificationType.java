package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "notification_types")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationType {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "type_id")
    private UUID typeId;

    @Column(name = "type_name", nullable = false, unique = true)
    private String typeName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "default_settings", columnDefinition = "JSON")
    private String defaultSettings;

    @OneToMany(mappedBy = "notificationType", cascade = CascadeType.ALL)
    private List<Notification> notifications;

    @OneToMany(mappedBy = "notificationType", cascade = CascadeType.ALL)
    private List<NotificationPreference> notificationPreferences;
} 
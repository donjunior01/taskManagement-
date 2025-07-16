package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_dashboards")
public class UsersDashboard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users Users;

    @Column(name = "active_projects")
    private Integer activeProjects;

    @Column(name = "completed_projects")
    private Integer completedProjects;

    @Column(name = "pending_tasks")
    private Integer pendingTasks;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
} 
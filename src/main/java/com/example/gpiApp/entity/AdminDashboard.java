package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "admin_dashboards")
public class AdminDashboard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private Admin admin;

    @Column(name = "total_users")
    private Integer totalUsers;

    @Column(name = "total_projects")
    private Integer totalProjects;

    @Column(name = "total_revenue")
    private Double totalRevenue;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
} 
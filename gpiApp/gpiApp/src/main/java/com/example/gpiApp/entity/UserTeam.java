package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "user_teams")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_team_id")
    private UUID userTeamId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private allUsers user;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
} 
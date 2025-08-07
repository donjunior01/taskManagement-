package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Entity
@Table(name = "task_priorities")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskPriority {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "priority_id")
    private Long priorityId;

    @Column(name = "priority_name", nullable = false, unique = true)
    private String priorityName;

    @Column(name = "priority_level", nullable = false)
    private Integer priorityLevel;

    @Column(name = "color_code")
    private String colorCode;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "priority", cascade = CascadeType.ALL)
    private List<Task> tasks;
} 
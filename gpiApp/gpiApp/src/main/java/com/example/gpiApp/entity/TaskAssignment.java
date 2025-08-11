package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "task_assignments")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Long assignmentId;

    @ManyToOne
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne
    @JoinColumn(name = "assigned_by", nullable = false)
    private allUsers assignedBy;

    @ManyToOne
    @JoinColumn(name = "assigned_to", nullable = false)
    private allUsers assignedTo;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_status", nullable = false)
    private AssignmentStatus assignmentStatus;

    @Column(name = "assignment_notes", columnDefinition = "TEXT")
    private String assignmentNotes;

    public enum AssignmentStatus {
        PENDING, ACCEPTED, REJECTED, COMPLETED
    }
} 
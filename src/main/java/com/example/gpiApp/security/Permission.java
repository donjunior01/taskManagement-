package com.example.gpiApp.security;

import com.example.gpiApp.entity.allUsers;

import java.util.EnumSet;
import java.util.Set;

/**
 * The fixed catalog of grantable permissions (fine-grained actions). Custom roles pick from this set;
 * users without a custom role fall back to the default set for their base role. Stored on roles by
 * {@link #name()} so the catalog can grow without a schema change.
 */
public enum Permission {
    PROJECT_VIEW("project.view"),
    PROJECT_CREATE("project.create"),
    PROJECT_EDIT("project.edit"),
    PROJECT_DELETE("project.delete"),
    TASK_VIEW("task.view"),
    TASK_CREATE("task.create"),
    TASK_EDIT("task.edit"),
    TASK_DELETE("task.delete"),
    TEAM_VIEW("team.view"),
    TEAM_MANAGE("team.manage"),
    DELIVERABLE_VIEW("deliverable.view"),
    DELIVERABLE_REVIEW("deliverable.review"),
    USER_VIEW("user.view"),
    USER_MANAGE("user.manage"),
    REPORT_VIEW("report.view"),
    SETTINGS_MANAGE("settings.manage"),
    AUDIT_VIEW("audit.view"),
    ROLE_MANAGE("role.manage"),
    BILLING_MANAGE("billing.manage");

    private final String key;

    Permission(String key) { this.key = key; }

    /** Stable string key persisted on roles and used in checks (e.g. "project.delete"). */
    public String getKey() { return key; }

    public static Permission fromKey(String key) {
        for (Permission p : values()) if (p.key.equals(key)) return p;
        return null;
    }

    /** Default permissions granted to a base role when the user has no custom role assigned. */
    public static Set<Permission> defaultsForBaseRole(allUsers.Role role) {
        if (role == null) return EnumSet.noneOf(Permission.class);
        switch (role) {
            case ADMIN:
                return EnumSet.allOf(Permission.class);
            case PROJECT_MANAGER:
                return EnumSet.of(
                        PROJECT_VIEW, PROJECT_CREATE, PROJECT_EDIT, PROJECT_DELETE,
                        TASK_VIEW, TASK_CREATE, TASK_EDIT, TASK_DELETE,
                        TEAM_VIEW, TEAM_MANAGE,
                        DELIVERABLE_VIEW, DELIVERABLE_REVIEW,
                        USER_VIEW, REPORT_VIEW);
            case USER:
            default:
                return EnumSet.of(
                        PROJECT_VIEW, TASK_VIEW, TASK_EDIT,
                        DELIVERABLE_VIEW, TEAM_VIEW);
        }
    }
}

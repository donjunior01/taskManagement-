package com.example.gpiApp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Data
@Entity
@Table(name = "allUsers")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "user_type", discriminatorType = DiscriminatorType.STRING)
@DiscriminatorValue(value = "NULL")
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class allUsers implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    /** The tenant this user belongs to (multi-tenancy). Defaults to the seeded org for existing data.
     *  Excluded from toString/equals: it's a LAZY proxy, so touching it on a detached entity throws. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Organization organization;

    /** Optional custom RBAC role; when set it overrides the base-role default permissions.
     *  Fully-qualified because the nested {@code Role} enum below shadows the Role entity.
     *  Excluded from toString/equals for the same lazy-proxy reason as {@link #organization}. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "custom_role_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private com.example.gpiApp.entity.Role customRole;

    @Column(nullable = false)
    private String password;

    /** When the password was last set — drives the password-rotation (expiry) policy. */
    @Column(name = "password_changed_at")
    private java.time.LocalDateTime passwordChangedAt;

    @Column(nullable = false, name = "first_name")
    private String firstName;

    @Column(nullable = false, name = "last_name")
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "two_factor_enabled", nullable = false)
    @Builder.Default
    private boolean twoFactorEnabled = false;

    @Column(name = "two_factor_secret")
    private String twoFactorSecret;

    /** JSON array of Argon2id-hashed one-time recovery codes (consumed as used). */
    @Column(name = "two_factor_recovery_codes", columnDefinition = "TEXT")
    private String twoFactorRecoveryCodes;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }

    public enum Role {
        ADMIN,
        PROJECT_MANAGER,
        USER
    }
}
package com.example.gpiApp.controller;

import com.example.gpiApp.dto.RegisterRequest;
import com.example.gpiApp.dto.LoginRequest;
import com.example.gpiApp.dto.LoginResponse;
import com.example.gpiApp.dto.ApiResponse;
import com.example.gpiApp.entity.Notification;
import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.repository.UserService;
import com.example.gpiApp.config.security.JwtUtil;
import com.example.gpiApp.service.NotificationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final com.example.gpiApp.service.TotpService totpService;
    private final com.example.gpiApp.service.LoginAttemptService loginAttemptService;
    private final com.example.gpiApp.service.ActivityLogService activityLogService;
    private final com.example.gpiApp.service.SessionService sessionService;
    private final com.example.gpiApp.service.TwoFactorService twoFactorService;
    private final com.example.gpiApp.repository.OrganizationRepository organizationRepository;
    private final com.example.gpiApp.service.SystemSettingsService systemSettingsService;
    private final com.example.gpiApp.service.IpResolverService ipResolver;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest httpRequest) {
        final String ip = clientIp(httpRequest);
        final String userAgent = httpRequest.getHeader("User-Agent");
        final String identifier = (loginRequest.getUsername() != null && !loginRequest.getUsername().trim().isEmpty())
                ? loginRequest.getUsername() : loginRequest.getEmail();

        // Refuse logins from admin-blocked IP addresses.
        if (loginAttemptService.isIpBlocked(ip)) {
            loginAttemptService.logLoginAttempt(identifier, identifier,
                    com.example.gpiApp.entity.LoginAttempt.LoginStatus.FAILURE, ip, userAgent,
                    "Adresse IP bloquée", null);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Votre adresse IP a été bloquée. Contactez un administrateur."));
        }

        // Account lockout: too many recent failed attempts for this identifier → refuse until it expires.
        // We do NOT record this as a new failed attempt (that would extend the lock indefinitely).
        long lockedMinutes = loginAttemptService.lockoutRemainingMinutes(identifier);
        if (lockedMinutes > 0) {
            try { activityLogService.logSecurityAlert("Login blocked — account temporarily locked: " + identifier, ip); } catch (Exception ignore) { }
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(java.util.Map.of("lockedMinutes", lockedMinutes,
                            "message", "Trop de tentatives échouées. Réessayez dans " + lockedMinutes + " minute(s)."));
        }

        try {
            String usernameOrEmail = loginRequest.getUsername();
            if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
                usernameOrEmail = loginRequest.getEmail();
            }

            if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Username or email is required"));
            }

            String finalIdentifier = usernameOrEmail;
            allUsers user = userRepository.findByEmail(finalIdentifier)
                    .or(() -> userRepository.findByUsername(finalIdentifier))
                    .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("User not found"));

            if (!user.isActive()) {
                loginAttemptService.logLoginAttempt(user.getUsername(), user.getEmail(),
                        com.example.gpiApp.entity.LoginAttempt.LoginStatus.FAILURE, ip, userAgent,
                        "Compte inactif / en attente d'activation", user.getId());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Votre compte n'est pas encore actif. Il est en attente d'activation par un administrateur."));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), loginRequest.getPassword())
            );

            // Maintenance mode — only admins may sign in while the platform is locked down.
            if (systemSettingsService.isMaintenanceMode() && user.getRole() != allUsers.Role.ADMIN) {
                loginAttemptService.logLoginAttempt(user.getUsername(), user.getEmail(),
                        com.example.gpiApp.entity.LoginAttempt.LoginStatus.FAILURE, ip, userAgent,
                        "Mode maintenance actif", user.getId());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("La plateforme est en maintenance. Seuls les administrateurs peuvent se connecter."));
            }

            // Two-factor challenge: password is correct, now require a valid TOTP code.
            if (user.isTwoFactorEnabled()) {
                String code = loginRequest.getCode();
                if (code == null || code.trim().isEmpty()) {
                    // Tell the client to prompt for the authenticator code, then resubmit.
                    return ResponseEntity.ok(java.util.Map.of("twoFactorRequired", true));
                }
                if (!twoFactorService.verifyUserCode(user, code)) {
                    loginAttemptService.logLoginAttempt(user.getUsername(), user.getEmail(),
                            com.example.gpiApp.entity.LoginAttempt.LoginStatus.FAILURE, ip, userAgent,
                            "Code 2FA invalide", user.getId());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(ApiResponse.error("Invalid authentication code"));
                }
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);
            // Register a revocable server-side session and bind the token to it (jti).
            String sessionId = sessionService.createSession(user, ip, userAgent);
            String jwt = jwtUtil.generateToken(
                    (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal(), sessionId);

            // Record the successful sign-in so the security journal can display it.
            loginAttemptService.logLoginAttempt(user.getUsername(), user.getEmail(),
                    com.example.gpiApp.entity.LoginAttempt.LoginStatus.SUCCESS, ip, userAgent,
                    "Connexion réussie", user.getId());

            LoginResponse loginResponse = new LoginResponse(jwt, user);
            // Policy enforcement: force 2FA enrolment before continuing when required — either for
            // everyone, or for admins specifically. We still issue a session (enrolment needs auth),
            // but flag the client to force the setup gate.
            if (!user.isTwoFactorEnabled()) {
                boolean mustEnrol = systemSettingsService.isTwoFactorRequiredForAll()
                        || (user.getRole() == allUsers.Role.ADMIN && systemSettingsService.isTwoFactorRequiredForAdmins());
                if (mustEnrol) loginResponse.setMfaSetupRequired(true);
            }

            // Password rotation policy: force a change once the password is older than the configured age.
            try {
                int expiryDays = systemSettingsService.getSettings().getPasswordExpiryDays();
                if (expiryDays > 0 && user.getPasswordChangedAt() != null
                        && user.getPasswordChangedAt().plusDays(expiryDays).isBefore(java.time.LocalDateTime.now())) {
                    loginResponse.setPasswordChangeRequired(true);
                }
            } catch (Exception ignore) { }

            return ResponseEntity.ok(loginResponse);
        } catch (org.springframework.security.core.AuthenticationException e) {
            // Record the failed attempt (bad credentials, user not found, etc.).
            loginAttemptService.logLoginAttempt(identifier, identifier,
                    com.example.gpiApp.entity.LoginAttempt.LoginStatus.FAILURE, ip, userAgent,
                    e.getMessage() != null ? e.getMessage() : "Identifiants invalides", null);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid credentials: " + e.getMessage()));
        }
    }

    /** Real client IP — honours X-Forwarded-For and substitutes the machine IP for loopback (local dev). */
    private String clientIp(HttpServletRequest request) {
        return ipResolver.resolveClientIp(request);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        // Check if username already exists
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Username already exists"));
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email already exists"));
        }

        // Enforce the configured password policy (admin Configuration → Security).
        String policyError = systemSettingsService.validatePassword(registerRequest.getPassword());
        if (policyError != null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(policyError));
        }

        try {
            allUsers user = new allUsers();
            user.setUsername(registerRequest.getUsername());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setPasswordChangedAt(java.time.LocalDateTime.now());
            // Phase 1: place new sign-ups in the default tenant (org-on-signup comes in a later phase).
            organizationRepository.findById(1L).ifPresent(user::setOrganization);
            user.setEmail(registerRequest.getEmail());
            user.setFirstName(registerRequest.getFirstName());
            user.setLastName(registerRequest.getLastName());
            user.setRole(allUsers.Role.USER); // Default role
            // New self-registrations start INACTIVE and must be approved by an admin.
            user.setActive(false);

            allUsers savedUser = userRepository.save(user);

            // Welcome note for the new user explaining the pending state.
            notificationService.createNotification(
                savedUser.getId(),
                "Compte en attente d'activation",
                "Votre compte a été créé et est en attente d'activation par un administrateur. Vous serez notifié dès qu'il sera activé.",
                Notification.NotificationType.SYSTEM,
                null,
                null,
                "accountPending",
                null
            );

            // Alert every admin so they can review and activate the new account.
            try {
                for (allUsers admin : userRepository.findByRole(allUsers.Role.ADMIN)) {
                    notificationService.createNotification(
                        admin.getId(),
                        "Nouvelle inscription à valider",
                        "L'utilisateur " + savedUser.getFirstName() + " " + savedUser.getLastName()
                            + " (" + savedUser.getEmail() + ") attend l'activation de son compte.",
                        Notification.NotificationType.SYSTEM,
                        null,
                        null,
                        "newRegistration",
                        java.util.Map.of(
                            "name", savedUser.getFirstName() + " " + savedUser.getLastName(),
                            "email", savedUser.getEmail())
                    );
                }
            } catch (Exception ignore) {
                // Notifying admins is best-effort; never fail registration on it.
            }

            return ResponseEntity.ok(ApiResponse.success(
                "Inscription réussie ! Votre compte est en attente d'activation par un administrateur.", savedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Registration failed. Please try again."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // Record the logout in the audit trail while the actor is still resolvable.
        try {
            activityLogService.logCurrentUserActivity(
                    com.example.gpiApp.entity.ActivityLog.ActivityType.USER_LOGOUT,
                    "User logged out", "AUTH", null);
        } catch (Exception ignore) { }

        // Revoke this device's server-side session so the token can never be replayed.
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                sessionService.revokeBySessionId(jwtUtil.extractSessionId(header.substring(7)));
            }
        } catch (Exception ignore) { }

        // Clear the Security Context
        SecurityContextHolder.clearContext();

        // Use Spring Security's logout handler for additional cleanup
        SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();
        logoutHandler.logout(request, response, SecurityContextHolder.getContext().getAuthentication());

        // Clear JWT cookie
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0);
        jwtCookie.setSecure(true); // Use HTTPS in production
        response.addCookie(jwtCookie);

        // Clear any other authentication-related cookies if they exist
        Cookie sessionCookie = new Cookie("JSESSIONID", null);
        sessionCookie.setPath("/");
        sessionCookie.setMaxAge(0);
        response.addCookie(sessionCookie);

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}
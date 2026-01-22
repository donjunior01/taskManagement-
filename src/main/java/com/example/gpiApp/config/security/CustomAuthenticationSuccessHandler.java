package com.example.gpiApp.config.security;

import com.example.gpiApp.entity.allUsers;
import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.LoginAttemptService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collection;
import java.util.logging.Logger;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    private static final Logger logger = Logger.getLogger(CustomAuthenticationSuccessHandler.class.getName());
    
    private final LoginAttemptService loginAttemptService;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                      HttpServletResponse response, 
                                      Authentication authentication) throws IOException, ServletException {
        
        logger.info("=== Authentication Success Handler ===");
        logger.info("Request URL: " + request.getRequestURL());
        logger.info("allUsers authenticated: " + authentication.getName());
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        logger.info("allUsers authorities: " + authorities);
        
        String redirectUrl = determineRedirectUrl(authorities);
        logger.info("Initial redirect URL: " + redirectUrl);
        
        // Clear any saved request
        request.getSession().removeAttribute("SPRING_SECURITY_SAVED_REQUEST");
        
        // Get the context path
        String contextPath = request.getContextPath();
        logger.info("Context path: " + contextPath);
        
        // Ensure redirect URL starts with context path
        if (!redirectUrl.startsWith(contextPath)) {
            redirectUrl = contextPath + redirectUrl;
        }
        
        logger.info("Final redirect URL: " + redirectUrl);
        logger.info("=== End Authentication Success Handler ===");
        
        // Log successful login attempt
        try {
            String email = authentication.getName();
            allUsers user = userRepository.findByEmail(email).orElse(null);
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            loginAttemptService.logLoginAttempt(
                user != null ? user.getUsername() : email,
                email,
                com.example.gpiApp.entity.LoginAttempt.LoginStatus.SUCCESS,
                ipAddress,
                userAgent,
                null,
                user != null ? user.getId() : null
            );
        } catch (Exception e) {
            logger.warning("Failed to log login attempt: " + e.getMessage());
        }
        
        response.sendRedirect(redirectUrl);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private String determineRedirectUrl(Collection<? extends GrantedAuthority> authorities) {
        logger.info("Determining redirect URL for authorities: " + authorities);
        
        for (GrantedAuthority authority : authorities) {
            String role = authority.getAuthority();
            logger.info("Processing role: " + role);
            
            if (role.equals("ROLE_ADMIN")) {
                logger.info("Found ADMIN role, redirecting to admin dashboard");
                return "/admin/adminDashboard";
            } else if (role.equals("ROLE_PROJECT_MANAGER")) {
                logger.info("Found PROJECT_MANAGER role, redirecting to project manager dashboard");
                return "/project-manager/pmDashboard";
            } else if (role.equals("ROLE_USER")) {
                logger.info("Found USER role, redirecting to user dashboard");
                return "/user/userDashboard";
            }
        }
        
        logger.warning("No matching role found, defaulting to login page");
        return "/api/auth/login";
    }
} 
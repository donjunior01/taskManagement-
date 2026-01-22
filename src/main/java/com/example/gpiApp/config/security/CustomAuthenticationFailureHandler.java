package com.example.gpiApp.config.security;

import com.example.gpiApp.repository.UserRepository;
import com.example.gpiApp.service.LoginAttemptService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.logging.Logger;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {
    private static final Logger logger = Logger.getLogger(CustomAuthenticationFailureHandler.class.getName());
    
    private final LoginAttemptService loginAttemptService;
    private final UserRepository userRepository;
    
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, 
                                       HttpServletResponse response, 
                                       AuthenticationException exception) throws IOException, ServletException {
        
        String email = request.getParameter("email");
        String username = email; // Use email as username if available
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        String reason = exception.getMessage();
        
        // Log failed login attempt
        try {
            loginAttemptService.logLoginAttempt(
                username,
                email,
                com.example.gpiApp.entity.LoginAttempt.LoginStatus.FAILURE,
                ipAddress,
                userAgent,
                reason,
                null
            );
        } catch (Exception e) {
            logger.warning("Failed to log failed login attempt: " + e.getMessage());
        }
        
        // Redirect to login page with error
        response.sendRedirect("/api/auth/login?error=true");
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
}


package com.example.gpiApp.config;

import com.example.gpiApp.config.security.CustomAuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final com.example.gpiApp.config.security.JwtRequestFilter jwtRequestFilter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200", "http://localhost:7574"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
                    "/actuator/health",
                    "/actuator/info",
                    "/error",
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/static/**",
                    "/webjars/**",
                    // Swagger UI
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/api-docs/**"
                ).permitAll()
                // API endpoints with role-based access
                .requestMatchers("/api/dashboard/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/dashboard/manager/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                .requestMatchers("/api/dashboard/user/**").authenticated()
                // User endpoints - allow profile access for all authenticated users
                .requestMatchers("/api/users/change-password").authenticated()
                .requestMatchers("/api/users/*/profile").authenticated()
                .requestMatchers("/api/users/list").authenticated()  // Read-only list for messaging
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users").authenticated()  // Read-only for messaging
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/*").authenticated()  // Read single user
                .requestMatchers("/api/users/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                // Project endpoints - allow read access for all authenticated users
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/projects/**").authenticated()
                .requestMatchers("/api/projects/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                .requestMatchers("/api/teams/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                .requestMatchers("/api/tasks/**").authenticated()
                .requestMatchers("/api/comments/**").authenticated()
                .requestMatchers("/api/time-logs/**").authenticated()
                .requestMatchers("/api/deliverables/**").authenticated()
                .requestMatchers("/api/messages/**").authenticated()
                .requestMatchers("/api/activity-logs/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                .requestMatchers("/api/calendar/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/files/**").authenticated()
                .requestMatchers("/uploads/**").authenticated()
                .requestMatchers("/api/support-tickets/my").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/support-tickets").authenticated()
                .requestMatchers("/api/support-tickets/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                // Conversational AI assistant — available to any authenticated user
                // (developers need task guidance and Q&A too). Declared BEFORE the
                // manager-only rule so these specific paths win the match.
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/ai/chat").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/ai/generate-description").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/ai/tasks/*/guidance").authenticated()
                // AI insights and prioritisation remain manager/admin only
                .requestMatchers("/api/ai/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                // Advanced analytics for managers and admins
                .requestMatchers("/api/analytics/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                // Two-factor enrolment — any authenticated user manages their own
                .requestMatchers("/api/2fa/**").authenticated()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtRequestFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
} 
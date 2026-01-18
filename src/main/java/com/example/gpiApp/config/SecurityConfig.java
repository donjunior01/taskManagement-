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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
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
                .requestMatchers("/api/support-tickets/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                // Dashboard pages
                .requestMatchers("/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/project-manager/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_PROJECT_MANAGER")
                .requestMatchers("/user/**").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/api/auth/login")
                .loginProcessingUrl("/api/auth/login")
                .usernameParameter("email")
                .passwordParameter("password")
                .successHandler(customAuthenticationSuccessHandler)
                .failureUrl("/api/auth/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessUrl("/api/auth/login")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                .invalidSessionUrl("/api/auth/login")
                .maximumSessions(1)
                .expiredUrl("/api/auth/login")
            )
            .authenticationProvider(authenticationProvider());

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
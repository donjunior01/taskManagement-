package com.example.gpiApp.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long JWT_EXPIRATION = 86400000; // 24 hours (fallback)

    private final com.example.gpiApp.service.SystemSettingsService systemSettingsService;

    public JwtUtil(com.example.gpiApp.service.SystemSettingsService systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateToken(userDetails);
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername(), null);
    }

    /** Generate a token bound to a server-side session id (jti) so it can be revoked. */
    public String generateToken(UserDetails userDetails, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername(), sessionId);
    }

    /** The session id (jti) embedded in the token, or null for legacy tokens. */
    public String extractSessionId(String token) {
        try {
            return extractClaim(token, Claims::getId);
        } catch (Exception e) {
            return null;
        }
    }

    private String createToken(Map<String, Object> claims, String subject, String sessionId) {
        long validity;
        try {
            validity = systemSettingsService.getJwtValidityMillis();
        } catch (Exception e) {
            validity = JWT_EXPIRATION;
        }
        io.jsonwebtoken.JwtBuilder builder = Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + validity));
        if (sessionId != null) builder.setId(sessionId);
        return builder.signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    private Key getSigningKey() {
        byte[] keyBytes = SECRET_KEY.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
} 
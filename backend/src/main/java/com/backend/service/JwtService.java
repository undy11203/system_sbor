package com.backend.service;

import com.backend.model.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final String ROLE_CLAIM = "role";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-hours:24}")
    private long expirationHours;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email, Role role) {
        long nowMs = System.currentTimeMillis();
        return Jwts.builder()
                .subject(email)
                .claim(ROLE_CLAIM, role.name())
                .issuedAt(new Date(nowMs))
                .expiration(new Date(nowMs + expirationHours * 3600_000L))
                .signWith(key())
                .compact();
    }

    public String extractEmail(String token) {
        return claims(token).getSubject();
    }

    public Role extractRole(String token) {
        String role = (String) claims(token).get(ROLE_CLAIM);
        return role != null ? Role.valueOf(role) : Role.STUDENT;
    }

    public boolean isValid(String token) {
        try {
            extractEmail(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

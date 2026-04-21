package com.smartcampus.auth.service;

import com.smartcampus.auth.model.AppUser;
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

    private final String jwtSecret;
    private final long jwtExpirationMinutes;

    public JwtService(
            @Value("${app.auth.jwt.secret}") String jwtSecret,
            @Value("${app.auth.jwt.expiration-minutes:1440}") long jwtExpirationMinutes
    ) {
        this.jwtSecret = jwtSecret;
        this.jwtExpirationMinutes = jwtExpirationMinutes;
    }

    public String generateToken(AppUser user) {
        Date issuedAt = new Date();
        Date expiresAt = new Date(issuedAt.getTime() + getExpirationInMillis());

        return Jwts.builder()
                .subject(user.getId())
                .claim("name", user.getUserName())
                .claim("email", user.getEmail())
                .claim("role", user.getRole() != null ? user.getRole().name() : "USER")
                .issuedAt(issuedAt)
                .expiration(expiresAt)
                .signWith(getSigningKey())
                .compact();
    }

    public long getExpirationInMillis() {
        return jwtExpirationMinutes * 60_000L;
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}

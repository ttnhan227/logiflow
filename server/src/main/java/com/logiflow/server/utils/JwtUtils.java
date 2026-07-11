package com.logiflow.server.utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;

@Component
public class JwtUtils {
    private final String secret;
    private final long expirationMs;

    public JwtUtils(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.expiration-ms}") long expirationMs) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
        }
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    public String generateToken(String username, String role){
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(secretToKey(secret))
                .compact();
    }
    
    public String extractRole(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretToKey(secret))
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .get("role", String.class);
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            throw new io.jsonwebtoken.JwtException("Invalid token", e);
        }
    }
    private SecretKey secretToKey(String secret){
        var  bytes = secret.getBytes(StandardCharsets.UTF_8);
        try{
             var key = Keys.hmacShaKeyFor(bytes);
             return key;
         }catch (Exception e){
             return Keys.hmacShaKeyFor(Arrays.copyOf(bytes, 64));
         }

    }
    public String extractUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretToKey(secret))
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            throw new io.jsonwebtoken.JwtException("Invalid token", e);
        }
    }
    public boolean isTokenExpired(String token){
        return extractExpiration(token).before(new Date());

    }
    public Date extractExpiration(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretToKey(secret))
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            throw new io.jsonwebtoken.JwtException("Invalid token", e);
        }
    }
    public boolean validateToken(String token, String username){
        return (username.equals(extractUsername(token)) && !isTokenExpired(token));
    }
}

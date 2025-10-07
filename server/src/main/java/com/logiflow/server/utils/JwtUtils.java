package com.logiflow.server.utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;

@Component
public class JwtUtils {
    private final String secret = "AIzaSyBhPSOMmpIh0enn94-eGKx0nM6tI8nxdG8";
    public String generateToken(String username, String role){
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis()+1000*60*60*10))
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
        } catch (Exception e) {
            throw new RuntimeException("Invalid token", e);
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
        } catch (Exception e) {
            throw new RuntimeException("Invalid token", e);
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
        } catch (Exception e) {
            throw new RuntimeException("Invalid token", e);
        }
    }
    public boolean validateToken(String token, String username){
        return (username.equals(extractUsername(token)) && !isTokenExpired(token));
    }
}

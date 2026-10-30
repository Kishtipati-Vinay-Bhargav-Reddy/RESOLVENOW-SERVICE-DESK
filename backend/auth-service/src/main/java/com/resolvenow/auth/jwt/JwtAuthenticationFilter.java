package com.resolvenow.auth.jwt;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();
        return "OPTIONS".equals(request.getMethod())
            || "/error".equals(path)
            || "POST".equals(request.getMethod())
            && (path.equals("/api/auth/register") || path.equals("/api/auth/login"));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();

        try {
            var claims = jwtService.extractClaims(token);
            String username = claims.getSubject();

            if (username != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {
            String role = claims.get("role", String.class);
            var authorities = role == null || role.isBlank()
                ? List.<SimpleGrantedAuthority>of()
                : List.of(new SimpleGrantedAuthority(
                    role.startsWith("ROLE_") ? role : "ROLE_" + role));

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                    authorities
                        );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }

        } catch (Exception ignored) {
        }

        filterChain.doFilter(request, response);
    }
}
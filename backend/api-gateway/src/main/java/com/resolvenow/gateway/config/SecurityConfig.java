package com.resolvenow.gateway.config;

import java.util.Arrays;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.resolvenow.gateway.jwt.JwtGatewayFilter;

@Configuration
public class SecurityConfig {

    private final JwtGatewayFilter jwtGatewayFilter;

    public SecurityConfig(JwtGatewayFilter jwtGatewayFilter) {
        this.jwtGatewayFilter = jwtGatewayFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)

            .cors(Customizer.withDefaults())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            // IMPORTANT:
            // Register JWT filter inside Spring Security chain
            .addFilterBefore(
                jwtGatewayFilter,
                UsernamePasswordAuthenticationFilter.class
            )

            .authorizeHttpRequests(auth -> auth

                // Public login and register
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/login",
                    "/api/auth/register"
                ).permitAll()

                // Public test endpoint
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/auth/test"
                ).permitAll()

                // Protected Complaint APIs
                .requestMatchers(
                    "/api/complaints/**"
                ).authenticated()

                // Protected Assignment APIs
                .requestMatchers(
                    "/api/assignments/**"
                ).authenticated()

                // Protected Notification APIs
                .requestMatchers(
                    "/api/notifications/**"
                ).authenticated()

                // Everything else
                .anyRequest().authenticated()
            );

        return http.build();
    }

    /*
     * IMPORTANT:
     * JwtGatewayFilter is already being added to the Spring Security
     * filter chain above.
     *
     * Therefore disable its automatic servlet-container registration.
     */
    @Bean
    public FilterRegistrationBean<JwtGatewayFilter>
    jwtGatewayFilterRegistration(JwtGatewayFilter filter) {

        FilterRegistrationBean<JwtGatewayFilter> registration =
                new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);

        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
            new CorsConfiguration();

        configuration.setAllowedOrigins(
            Arrays.asList("http://localhost:5173")
        );

        configuration.setAllowedMethods(
            Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
            )
        );

        configuration.setAllowedHeaders(
            Arrays.asList("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }
}
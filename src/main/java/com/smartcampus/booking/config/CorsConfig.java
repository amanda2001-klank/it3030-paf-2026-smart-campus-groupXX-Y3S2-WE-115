package com.smartcampus.booking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS configuration is now handled centrally by SecurityConfig.
 * This class is kept for reference but disabled to avoid duplicate configurations.
 * 
 * @deprecated Use SecurityConfig instead
 */
@Deprecated
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    // CORS is handled by SecurityConfig - no additional configuration needed here
}

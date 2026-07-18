package com.cashcompass.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI CashCompassOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("CashCompassAPI - AI Financial Platform")
                .description("AI-powered Financial Stability & Future Planning Platform REST API. " +
                    "Designed for freelancers, business owners, and professionals with variable income. " +
                    "Includes Financial Stability Scoring, AI Forecasting, Scenario Simulation, and Explainable AI.")
                .version("1.0.0")
                .contact(new Contact().name("CashCompass Team").email("CashCompass@example.com"))
            )
            .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
            .components(new Components().addSecuritySchemes("Bearer Authentication",
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Enter your JWT token from /api/auth/signin")
            ));
    }
}

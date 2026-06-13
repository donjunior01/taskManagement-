package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public, unauthenticated branding payload. Lets the login/registration pages and
 * the rest of the app render the admin-configured app name, logo and PDF colours
 * before a user is signed in. Never includes any sensitive configuration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandingDTO {
    private String appName;
    private String logoUrl;
    private String pdfHeaderColor;
    private String pdfFooterColor;
    private String pdfFooterText;
}

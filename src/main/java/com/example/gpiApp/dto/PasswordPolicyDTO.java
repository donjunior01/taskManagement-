package com.example.gpiApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public, unauthenticated view of the active password policy so the registration
 * page can show the requirements and validate input before submission.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordPolicyDTO {
    private Integer minLength;
    private Boolean requireUppercase;
    private Boolean requireDigit;
    private Boolean requireSpecial;
}

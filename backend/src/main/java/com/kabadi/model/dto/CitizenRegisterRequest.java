package com.kabadi.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CitizenRegisterRequest {
    @NotBlank private String name;
    @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$") private String mobile;
    private String addressLine1;
    private String addressLine2;
    @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits") private String pincode;
    private String preferredLanguage = "en";
}

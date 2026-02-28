package com.kabadi.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class KabadiRegisterRequest {
    @NotBlank private String name;
    @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$") private String mobile;
    private String area;
    private String addressLine1;
    private String addressLine2;
    private String pincode;
    private String preferredLanguage = "en";
}

package com.kabadi.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank private String mobile;
    @NotBlank @Size(min = 6, max = 6) private String otp;
    @NotBlank private String userType;
}

package com.kabadi.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SendOtpRequest {
    @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
    private String mobile;
    @NotBlank private String userType; // CITIZEN | KABADI
}

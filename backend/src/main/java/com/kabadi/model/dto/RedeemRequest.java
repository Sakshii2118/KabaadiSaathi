package com.kabadi.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RedeemRequest {
    @NotBlank private String selectedCommodity;
}

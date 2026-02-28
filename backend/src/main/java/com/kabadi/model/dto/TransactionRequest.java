package com.kabadi.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransactionRequest {
    private Long userId;
    @NotNull private Long kabadiWalaId;
    @NotBlank private String materialType;
    @NotNull @DecimalMin("0.1") private BigDecimal weightKg;
    @NotNull @DecimalMin("0.1") private BigDecimal pricePerKg;
}

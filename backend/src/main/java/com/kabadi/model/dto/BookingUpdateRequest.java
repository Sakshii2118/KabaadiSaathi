package com.kabadi.model.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BookingUpdateRequest {
    private String materialType;
    private BigDecimal expectedWeightKg;
}

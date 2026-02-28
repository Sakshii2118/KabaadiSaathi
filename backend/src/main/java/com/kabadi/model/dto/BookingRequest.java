package com.kabadi.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingRequest {
    @NotNull private Long userId;
    private Long kabadiWalaId;
    private String pickupAddress;
    private Double latitude;
    private Double longitude;
    private LocalDateTime scheduledAt;
    private String materialType;
    private BigDecimal expectedWeightKg;
}

package com.kabadi.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "kabadi_walas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KabadiWala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String mobile;

    private String otpCode;
    private LocalDateTime otpExpiresAt;
    private String area;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(nullable = false)
    private Integer kCoinsBalance = 0;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyCollectedKg = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private Boolean dailyThresholdUnlocked = false;

    private LocalDate lastThresholdReset;

    @Builder.Default
    @Column(nullable = false)
    private Boolean priorityActive = false;

    private LocalDateTime priorityExpiresAt;

    @Builder.Default
    @Column(columnDefinition = "varchar(5) default 'en'")
    private String preferredLanguage = "en";

    @Builder.Default
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Lat/Long for map discovery
    private Double latitude;
    private Double longitude;
}

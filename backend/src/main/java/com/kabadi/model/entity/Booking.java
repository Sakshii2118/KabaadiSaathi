package com.kabadi.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"otpCode", "otpExpiresAt", "hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kabadi_wala_id")
    @JsonIgnoreProperties({"otpCode", "otpExpiresAt", "hibernateLazyInitializer", "handler"})
    private KabadiWala kabadiWala;

    @Column(columnDefinition = "TEXT")
    private String pickupAddress;

    private Double latitude;
    private Double longitude;
    private LocalDateTime scheduledAt;

    @Builder.Default
    @Column(nullable = false)
    private String status = "PENDING";  // PENDING | COMPLETED | CANCELLED

    private String materialType;

    @Column(precision = 10, scale = 2)
    private BigDecimal expectedWeightKg;

    @Builder.Default
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

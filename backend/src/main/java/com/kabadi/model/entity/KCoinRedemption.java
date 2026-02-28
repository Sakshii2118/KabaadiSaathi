package com.kabadi.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "k_coin_redemptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class KCoinRedemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kabadi_wala_id", nullable = false)
    @JsonIgnoreProperties({"otpCode", "otpExpiresAt", "hibernateLazyInitializer", "handler"})
    private KabadiWala kabadiWala;

    private Integer coinsRedeemed;
    private String selectedCommodity;

    @Builder.Default
    private LocalDateTime redeemedAt = LocalDateTime.now();

    private LocalDateTime validUntil;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;
}

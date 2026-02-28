package com.kabadi.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WasteTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"otpCode", "otpExpiresAt", "hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kabadi_wala_id", nullable = false)
    @JsonIgnoreProperties({"otpCode", "otpExpiresAt", "hibernateLazyInitializer", "handler"})
    private KabadiWala kabadiWala;

    @Column(nullable = false)
    private String materialType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal weightKg;

    @Column(precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(precision = 10, scale = 2)
    private BigDecimal pricePerKg;

    @Builder.Default
    private LocalDateTime transactionTime = LocalDateTime.now();
}

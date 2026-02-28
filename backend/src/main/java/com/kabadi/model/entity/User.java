package com.kabadi.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String mobile;

    private String otpCode;
    private LocalDateTime otpExpiresAt;

    @Column(unique = true)
    private String wasteRecyclerId;

    private String addressLine1;
    private String addressLine2;
    private String pincode;

    @Builder.Default
    @Column(columnDefinition = "varchar(5) default 'en'")
    private String preferredLanguage = "en";

    @Builder.Default
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

package com.kabadi.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String configKey;

    @Column(nullable = false)
    private String configValue;

    private LocalDateTime updatedAt = LocalDateTime.now();
}

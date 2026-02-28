package com.kabadi.repository;

import com.kabadi.model.entity.AdminConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminConfigRepository extends JpaRepository<AdminConfig, Long> {
    Optional<AdminConfig> findByConfigKey(String configKey);
}

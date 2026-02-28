package com.kabadi.repository;

import com.kabadi.model.entity.KCoinRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface KCoinRedemptionRepository extends JpaRepository<KCoinRedemption, Long> {
    Optional<KCoinRedemption> findByKabadiWalaIdAndIsActiveTrue(Long kabadiWalaId);
}

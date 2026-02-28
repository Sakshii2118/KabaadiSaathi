package com.kabadi.repository;

import com.kabadi.model.entity.KabadiWala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface KabadiWalaRepository extends JpaRepository<KabadiWala, Long> {
    Optional<KabadiWala> findByMobile(String mobile);
    boolean existsByMobile(String mobile);

    @Query(value = """
        SELECT *, (
          6371 * acos(
            cos(radians(:lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(latitude))
          )
        ) AS distance
        FROM kabadi_walas
        WHERE is_active = true
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND priority_active = true
          AND priority_expires_at > NOW()
        HAVING distance <= :radiusKm
        ORDER BY distance ASC
        """, nativeQuery = true)
    List<KabadiWala> findPriorityWithinRadius(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusKm") double radiusKm
    );

    @Query(value = """
        SELECT *, (
          6371 * acos(
            cos(radians(:lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(latitude))
          )
        ) AS distance
        FROM kabadi_walas
        WHERE is_active = true
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        HAVING distance <= :radiusKm
        ORDER BY distance ASC
        """, nativeQuery = true)
    List<KabadiWala> findNearbyWithinRadius(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusKm") double radiusKm
    );
}

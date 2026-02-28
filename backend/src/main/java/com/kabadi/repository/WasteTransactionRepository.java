package com.kabadi.repository;

import com.kabadi.model.entity.WasteTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface WasteTransactionRepository extends JpaRepository<WasteTransaction, Long> {
    List<WasteTransaction> findByKabadiWalaIdOrderByTransactionTimeDesc(Long kabadiWalaId);
    List<WasteTransaction> findByUserIdOrderByTransactionTimeDesc(Long userId);

    @Query("SELECT t FROM WasteTransaction t WHERE t.kabadiWala.id = :id AND t.transactionTime >= :from ORDER BY t.transactionTime DESC")
    List<WasteTransaction> findByKabadiWalaIdSince(@Param("id") Long id, @Param("from") LocalDateTime from);

    @Query("SELECT t FROM WasteTransaction t WHERE t.user.id = :id AND t.transactionTime >= :from ORDER BY t.transactionTime DESC")
    List<WasteTransaction> findByUserIdSince(@Param("id") Long id, @Param("from") LocalDateTime from);

    // Sum weight for a kabadi-wala from a given time (used for accurate daily total)
    @Query("SELECT COALESCE(SUM(t.weightKg), 0) FROM WasteTransaction t WHERE t.kabadiWala.id = :id AND t.transactionTime >= :from")
    BigDecimal sumWeightByKabadiWalaSince(@Param("id") Long id, @Param("from") LocalDateTime from);
}


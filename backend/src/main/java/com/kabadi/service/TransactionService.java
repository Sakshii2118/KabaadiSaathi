package com.kabadi.service;

import com.kabadi.exception.BadRequestException;
import com.kabadi.model.dto.TransactionRequest;
import com.kabadi.model.entity.*;
import com.kabadi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final WasteTransactionRepository txRepo;
    private final UserRepository userRepo;
    private final KabadiWalaRepository kabadiRepo;
    private final AdminConfigRepository configRepo;

    private int getConfig(String key, int defaultVal) {
        return configRepo.findByConfigKey(key)
            .map(c -> Integer.parseInt(c.getConfigValue()))
            .orElse(defaultVal);
    }

    @Transactional
    public Map<String, Object> logTransaction(TransactionRequest req) {
        KabadiWala kw = kabadiRepo.findById(req.getKabadiWalaId())
            .orElseThrow(() -> new BadRequestException("Kabadi-wala not found"));

        User user = null;
        if (req.getUserId() != null) {
            user = userRepo.findById(req.getUserId()).orElse(null);
        }

        BigDecimal amount = req.getWeightKg().multiply(req.getPricePerKg()).setScale(2, RoundingMode.HALF_UP);

        WasteTransaction tx = WasteTransaction.builder()
            .user(user).kabadiWala(kw)
            .materialType(req.getMaterialType())
            .weightKg(req.getWeightKg())
            .amountPaid(amount)
            .pricePerKg(req.getPricePerKg())
            .transactionTime(LocalDateTime.now())
            .build();
        txRepo.save(tx);

        // K-Coin calculation
        int thresholdKg = getConfig("daily_unlock_threshold_kg", 20);
        int coinsPerKg = getConfig("kcoins_per_extra_kg", 5);

        // Reset daily if needed
        if (kw.getLastThresholdReset() == null || kw.getLastThresholdReset().isBefore(LocalDate.now())) {
            kw.setDailyCollectedKg(BigDecimal.ZERO);
            kw.setDailyThresholdUnlocked(false);
            kw.setLastThresholdReset(LocalDate.now());
        }

        BigDecimal newTotal = kw.getDailyCollectedKg().add(req.getWeightKg());
        kw.setDailyCollectedKg(newTotal);

        int kCoinsEarned = 0;
        if (newTotal.compareTo(BigDecimal.valueOf(thresholdKg)) >= 0) {
            kw.setDailyThresholdUnlocked(true);
            BigDecimal extraKg = newTotal.subtract(BigDecimal.valueOf(thresholdKg));
            kCoinsEarned = extraKg.divide(BigDecimal.valueOf(coinsPerKg), 0, RoundingMode.FLOOR).intValue();
            kw.setKCoinsBalance(kw.getKCoinsBalance() + kCoinsEarned);
        }
        kabadiRepo.save(kw);

        return Map.of(
            "transactionId", tx.getId(),
            "amountPaid", amount,
            "kCoinsEarned", kCoinsEarned,
            "newKCoinBalance", kw.getKCoinsBalance(),
            "dailyCollectedKg", kw.getDailyCollectedKg(),
            "thresholdUnlocked", kw.getDailyThresholdUnlocked()
        );
    }

    public List<WasteTransaction> getKabadiTransactions(Long kabadiId, String filter) {
        LocalDateTime from = getFromDate(filter);
        return from == null ? txRepo.findByKabadiWalaIdOrderByTransactionTimeDesc(kabadiId)
            : txRepo.findByKabadiWalaIdSince(kabadiId, from);
    }

    public List<WasteTransaction> getUserTransactions(Long userId, String filter) {
        LocalDateTime from = getFromDate(filter);
        return from == null ? txRepo.findByUserIdOrderByTransactionTimeDesc(userId)
            : txRepo.findByUserIdSince(userId, from);
    }

    private LocalDateTime getFromDate(String filter) {
        if (filter == null) return null;
        return switch (filter.toLowerCase()) {
            case "daily" -> LocalDateTime.now().toLocalDate().atStartOfDay();
            case "monthly" -> LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
            case "yearly" -> LocalDateTime.now().withDayOfYear(1).toLocalDate().atStartOfDay();
            default -> null;
        };
    }
}

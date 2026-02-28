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

        // ── K-Coin Calculation ────────────────────────────────────
        int thresholdKg = getConfig("daily_unlock_threshold_kg", 20);
        int kgPerCoin   = getConfig("kcoins_per_extra_kg", 5);

        // Reset daily counter if it's a new day
        if (kw.getLastThresholdReset() == null || kw.getLastThresholdReset().isBefore(LocalDate.now())) {
            kw.setDailyCollectedKg(BigDecimal.ZERO);
            kw.setDailyThresholdUnlocked(false);
            kw.setLastThresholdReset(LocalDate.now());
        }

        BigDecimal prevTotal = kw.getDailyCollectedKg();         // kg BEFORE this transaction
        BigDecimal newTotal  = prevTotal.add(req.getWeightKg()); // kg AFTER  this transaction
        kw.setDailyCollectedKg(newTotal);

        int kCoinsEarned = 0;
        BigDecimal threshold = BigDecimal.valueOf(thresholdKg);
        BigDecimal perCoin   = BigDecimal.valueOf(kgPerCoin);

        if (newTotal.compareTo(threshold) >= 0) {
            kw.setDailyThresholdUnlocked(true);

            // Coins already awarded by earlier transactions today (floor division)
            BigDecimal prevExtra = prevTotal.subtract(threshold).max(BigDecimal.ZERO);
            int prevCoins = prevExtra.divide(perCoin, 0, RoundingMode.FLOOR).intValue();

            // Coins that should exist after this transaction (floor division)
            BigDecimal newExtra = newTotal.subtract(threshold);
            int newCoins = newExtra.divide(perCoin, 0, RoundingMode.FLOOR).intValue();

            // Only award the incremental difference — never double-count
            kCoinsEarned = newCoins - prevCoins;
            kw.setKCoinsBalance(kw.getKCoinsBalance() + kCoinsEarned);
        }
        kabadiRepo.save(kw);

        Map<String, Object> result = new HashMap<>();
        result.put("transactionId",     tx.getId());
        result.put("amountPaid",        amount);
        result.put("kCoinsEarned",      kCoinsEarned);
        result.put("newKCoinBalance",   kw.getKCoinsBalance());
        result.put("dailyCollectedKg",  kw.getDailyCollectedKg());
        result.put("thresholdUnlocked", kw.getDailyThresholdUnlocked());
        return result;
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
            case "daily"   -> LocalDateTime.now().toLocalDate().atStartOfDay();
            case "monthly" -> LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
            case "yearly"  -> LocalDateTime.now().withDayOfYear(1).toLocalDate().atStartOfDay();
            default        -> null;
        };
    }
}

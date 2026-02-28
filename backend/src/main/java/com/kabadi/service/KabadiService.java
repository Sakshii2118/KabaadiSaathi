package com.kabadi.service;

import com.kabadi.exception.BadRequestException;
import com.kabadi.exception.ResourceNotFoundException;
import com.kabadi.model.dto.RedeemRequest;
import com.kabadi.model.entity.*;
import com.kabadi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class KabadiService {

    private final KabadiWalaRepository kabadiRepo;
    private final WasteTransactionRepository txRepo;
    private final KCoinRedemptionRepository redemptionRepo;
    private final AdminConfigRepository configRepo;

    private int getConfig(String key, int defaultVal) {
        return configRepo.findByConfigKey(key)
            .map(c -> Integer.parseInt(c.getConfigValue()))
            .orElse(defaultVal);
    }

    public KabadiWala getProfile(Long id) {
        return kabadiRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Kabadi-wala not found"));
    }

    @Transactional
    public KabadiWala updateProfile(Long id, Map<String, String> body) {
        KabadiWala kw = getProfile(id);
        if (body.containsKey("name")) kw.setName(body.get("name"));
        if (body.containsKey("area")) kw.setArea(body.get("area"));
        if (body.containsKey("addressLine1")) kw.setAddressLine1(body.get("addressLine1"));
        if (body.containsKey("addressLine2")) kw.setAddressLine2(body.get("addressLine2"));
        if (body.containsKey("pincode")) kw.setPincode(body.get("pincode"));
        if (body.containsKey("preferredLanguage")) kw.setPreferredLanguage(body.get("preferredLanguage"));
        if (body.containsKey("latitude")) kw.setLatitude(Double.parseDouble(body.get("latitude")));
        if (body.containsKey("longitude")) kw.setLongitude(Double.parseDouble(body.get("longitude")));
        return kabadiRepo.save(kw);
    }

    @Transactional
    public Map<String, Object> getDashboard(Long id, String filter) {
        KabadiWala kw = getProfile(id);

        // Total collected: sum of all transaction weights ever
        List<WasteTransaction> allTxs = txRepo.findByKabadiWalaIdOrderByTransactionTimeDesc(id);
        BigDecimal totalCollected = allTxs.stream()
            .map(WasteTransaction::getWeightKg)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Daily collected: always live from DB (today midnight → now)
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        BigDecimal dailyCollected = txRepo.sumWeightByKabadiWalaSince(id, todayStart);
        if (dailyCollected == null) dailyCollected = BigDecimal.ZERO;

        int thresholdKg = getConfig("daily_unlock_threshold_kg", 20);
        boolean thresholdUnlocked = dailyCollected.compareTo(BigDecimal.valueOf(thresholdKg)) >= 0;

        // Keep entity in sync so K-coin logic stays consistent on next transaction
        if (kw.getLastThresholdReset() == null || kw.getLastThresholdReset().isBefore(LocalDate.now())) {
            kw.setDailyCollectedKg(dailyCollected);
            kw.setDailyThresholdUnlocked(thresholdUnlocked);
            kw.setLastThresholdReset(LocalDate.now());
            kabadiRepo.save(kw);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalCollectedKg",  totalCollected);
        result.put("dailyCollectedKg",  dailyCollected);
        result.put("thresholdUnlocked", thresholdUnlocked);
        result.put("thresholdKg",       thresholdKg);
        result.put("kCoinsBalance",     kw.getKCoinsBalance());
        result.put("priorityActive",    kw.getPriorityActive());
        result.put("transactionCount",  allTxs.size());
        return result;
    }

    public Map<String, Object> getKCoins(Long id) {
        KabadiWala kw = getProfile(id);
        int redemptionThreshold = getConfig("redemption_threshold_coins", 30);
        Optional<KCoinRedemption> activeRedemption = redemptionRepo.findByKabadiWalaIdAndIsActiveTrue(id);
        Map<String, Object> result = new HashMap<>();
        result.put("kCoinsBalance", kw.getKCoinsBalance());
        result.put("dailyCollectedKg", kw.getDailyCollectedKg());
        result.put("thresholdUnlocked", kw.getDailyThresholdUnlocked());
        result.put("redemptionEligible", kw.getKCoinsBalance() >= redemptionThreshold);
        result.put("priorityActive", kw.getPriorityActive());
        result.put("priorityExpiresAt", kw.getPriorityExpiresAt());
        activeRedemption.ifPresent(r -> {
            result.put("activeRedemption", Map.of(
                "commodity", r.getSelectedCommodity(),
                "validUntil", r.getValidUntil(),
                "coinsRedeemed", r.getCoinsRedeemed()
            ));
        });
        return result;
    }

    @Transactional
    public Map<String, Object> redeemKCoins(Long id, RedeemRequest req) {
        KabadiWala kw = getProfile(id);
        int threshold = getConfig("redemption_threshold_coins", 30);
        int validityDays = getConfig("redemption_validity_days", 2);

        if (kw.getKCoinsBalance() < threshold)
            throw new BadRequestException("Insufficient K-Coins. Need " + threshold + " to redeem.");
        if (redemptionRepo.findByKabadiWalaIdAndIsActiveTrue(id).isPresent())
            throw new BadRequestException("Active redemption already exists. Cannot stack redemptions.");

        kw.setKCoinsBalance(kw.getKCoinsBalance() - threshold);
        LocalDateTime validUntil = LocalDateTime.now().plusDays(validityDays);
        kw.setPriorityActive(true);
        kw.setPriorityExpiresAt(validUntil);
        kabadiRepo.save(kw);

        KCoinRedemption redemption = KCoinRedemption.builder()
            .kabadiWala(kw).coinsRedeemed(threshold)
            .selectedCommodity(req.getSelectedCommodity())
            .validUntil(validUntil).isActive(true)
            .build();
        redemptionRepo.save(redemption);

        return Map.of("success", true, "validUntil", validUntil,
            "commodity", req.getSelectedCommodity(), "priorityActive", true);
    }

    public List<KabadiWala> findPriority(double lat, double lng) {
        return kabadiRepo.findPriorityWithinRadius(lat, lng, 5.0);
    }

    public List<KabadiWala> findNearby(double lat, double lng, double radius) {
        return kabadiRepo.findNearbyWithinRadius(lat, lng, radius);
    }

    @Transactional
    public void updateLanguage(Long id, String lang) {
        KabadiWala kw = getProfile(id);
        kw.setPreferredLanguage(lang);
        kabadiRepo.save(kw);
    }
}

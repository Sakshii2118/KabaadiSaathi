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
        if (body.containsKey("preferredLanguage")) kw.setPreferredLanguage(body.get("preferredLanguage"));
        if (body.containsKey("latitude")) kw.setLatitude(Double.parseDouble(body.get("latitude")));
        if (body.containsKey("longitude")) kw.setLongitude(Double.parseDouble(body.get("longitude")));
        return kabadiRepo.save(kw);
    }

    public Map<String, Object> getDashboard(Long id, String filter) {
        KabadiWala kw = getProfile(id);
        List<WasteTransaction> txs = txRepo.findByKabadiWalaIdOrderByTransactionTimeDesc(id);
        BigDecimal totalCollected = txs.stream()
            .map(WasteTransaction::getWeightKg)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
            "totalCollectedKg", totalCollected,
            "dailyCollectedKg", kw.getDailyCollectedKg(),
            "thresholdUnlocked", kw.getDailyThresholdUnlocked(),
            "kCoinsBalance", kw.getKCoinsBalance(),
            "priorityActive", kw.getPriorityActive(),
            "transactionCount", txs.size()
        );
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

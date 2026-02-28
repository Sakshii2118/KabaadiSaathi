package com.kabadi.service;

import com.kabadi.exception.ResourceNotFoundException;
import com.kabadi.model.entity.*;
import com.kabadi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CitizenService {

    private final UserRepository userRepo;
    private final WasteTransactionRepository txRepo;

    public User getProfile(Long userId) {
        return userRepo.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Citizen not found"));
    }

    @Transactional
    public User updateProfile(Long userId, Map<String, String> body) {
        User user = getProfile(userId);
        if (body.containsKey("name")) user.setName(body.get("name"));
        if (body.containsKey("addressLine1")) user.setAddressLine1(body.get("addressLine1"));
        if (body.containsKey("addressLine2")) user.setAddressLine2(body.get("addressLine2"));
        if (body.containsKey("pincode")) user.setPincode(body.get("pincode"));
        if (body.containsKey("preferredLanguage")) user.setPreferredLanguage(body.get("preferredLanguage"));
        return userRepo.save(user);
    }

    public Map<String, Object> getDashboard(Long userId, String filter) {
        List<WasteTransaction> txs = txRepo.findByUserIdOrderByTransactionTimeDesc(userId);
        BigDecimal totalEarnings = txs.stream()
            .map(t -> t.getAmountPaid() != null ? t.getAmountPaid() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalWaste = txs.stream()
            .map(WasteTransaction::getWeightKg)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
            "totalEarnings", totalEarnings,
            "totalWasteSoldKg", totalWaste,
            "transactionCount", txs.size()
        );
    }

    @Transactional
    public void updateLanguage(Long userId, String lang) {
        User user = getProfile(userId);
        user.setPreferredLanguage(lang);
        userRepo.save(user);
    }
}

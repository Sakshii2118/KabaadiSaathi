package com.kabadi.service;

import com.kabadi.model.entity.*;
import com.kabadi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepo;
    private final KabadiWalaRepository kabadiRepo;
    private final WasteTransactionRepository txRepo;
    private final AdminConfigRepository configRepo;

    public Map<String, Object> getOverview() {
        return Map.of(
            "totalUsers", userRepo.count(),
            "totalKabadis", kabadiRepo.count(),
            "totalTransactions", txRepo.count()
        );
    }

    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    public List<KabadiWala> getAllKabadis() {
        return kabadiRepo.findAll();
    }

    public List<WasteTransaction> getAllTransactions() {
        return txRepo.findAll();
    }

    public List<AdminConfig> getAllConfig() {
        return configRepo.findAll();
    }

    @Transactional
    public AdminConfig updateConfig(String key, String value) {
        AdminConfig cfg = configRepo.findByConfigKey(key)
            .orElse(AdminConfig.builder().configKey(key).build());
        cfg.setConfigValue(value);
        cfg.setUpdatedAt(LocalDateTime.now());
        return configRepo.save(cfg);
    }
}

package com.kabadi.scheduler;

import com.kabadi.model.entity.KCoinRedemption;
import com.kabadi.model.entity.KabadiWala;
import com.kabadi.repository.KCoinRedemptionRepository;
import com.kabadi.repository.KabadiWalaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class KCoinScheduler {

    private final KabadiWalaRepository kabadiRepo;
    private final KCoinRedemptionRepository redemptionRepo;

    /** Runs at midnight every day to reset daily thresholds */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetDailyThresholds() {
        log.info("Running daily K-Coin threshold reset...");
        List<KabadiWala> all = kabadiRepo.findAll();
        for (KabadiWala kw : all) {
            kw.setDailyCollectedKg(BigDecimal.ZERO);
            kw.setDailyThresholdUnlocked(false);
            kw.setLastThresholdReset(LocalDate.now());
        }
        kabadiRepo.saveAll(all);
        log.info("Reset daily thresholds for {} kabadi-walas", all.size());
    }

    /** Runs every 15 minutes to expire redemptions */
    @Scheduled(fixedRate = 900000)
    @Transactional
    public void expireRedemptions() {
        List<KCoinRedemption> active = redemptionRepo.findAll().stream()
            .filter(r -> r.getIsActive() && r.getValidUntil().isBefore(LocalDateTime.now()))
            .toList();
        for (KCoinRedemption r : active) {
            r.setIsActive(false);
            KabadiWala kw = r.getKabadiWala();
            kw.setPriorityActive(false);
            kw.setPriorityExpiresAt(null);
            kabadiRepo.save(kw);
        }
        if (!active.isEmpty()) {
            redemptionRepo.saveAll(active);
            log.info("Expired {} K-Coin redemptions", active.size());
        }
    }
}

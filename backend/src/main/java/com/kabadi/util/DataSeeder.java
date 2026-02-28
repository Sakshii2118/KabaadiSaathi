package com.kabadi.util;

import com.kabadi.model.entity.*;
import com.kabadi.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final KabadiWalaRepository kabadiRepo;
    private final WasteTransactionRepository txRepo;
    private final KCoinRedemptionRepository redemptionRepo;
    private final AdminRepository adminRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Always ensure admin has correct password (upsert)
        String encodedPassword = passwordEncoder.encode("admin123");
        adminRepo.findByUsername("admin").ifPresentOrElse(
            admin -> {
                // Always update hash so it's always valid
                admin.setPasswordHash(encodedPassword);
                adminRepo.save(admin);
                log.info("Admin password refreshed.");
            },
            () -> {
                adminRepo.save(Admin.builder()
                    .username("admin")
                    .passwordHash(encodedPassword)
                    .build());
                log.info("Admin user seeded.");
            }
        );

        if (userRepo.count() > 0) {
            log.info("Demo data already seeded. Skipping.");
            return;
        }

        log.info("Seeding demo data...");

        // Citizens
        User c1 = userRepo.save(User.builder()
            .name("Priya Sharma").mobile("9876543210")
            .wasteRecyclerId("WR-2026-00001")
            .addressLine1("12 Gandhi Nagar").addressLine2("Sector 5")
            .pincode("110001").preferredLanguage("en").build());
        User c2 = userRepo.save(User.builder()
            .name("Rahul Verma").mobile("9876543211")
            .wasteRecyclerId("WR-2026-00002")
            .addressLine1("45 MG Road").pincode("560001")
            .preferredLanguage("hi").build());
        User c3 = userRepo.save(User.builder()
            .name("Anita Das").mobile("9876543212")
            .wasteRecyclerId("WR-2026-00003")
            .addressLine1("78 Park Street").pincode("700001")
            .preferredLanguage("bn").build());

        // Kabadi-walas
        KabadiWala k1 = kabadiRepo.save(KabadiWala.builder()
            .name("Ramu Kabadiwala").mobile("9800000001")
            .area("Connaught Place").isActive(true)
            .kCoinsBalance(35).latitude(28.6315).longitude(77.2167)
            .priorityActive(true).priorityExpiresAt(LocalDateTime.now().plusDays(1))
            .preferredLanguage("hi").build());
        KabadiWala k2 = kabadiRepo.save(KabadiWala.builder()
            .name("Shyam Junk Dealer").mobile("9800000002")
            .area("Lajpat Nagar").isActive(true).kCoinsBalance(10)
            .latitude(28.5677).longitude(77.2441).preferredLanguage("hi").build());
        KabadiWala k3 = kabadiRepo.save(KabadiWala.builder()
            .name("Abdul Recyclables").mobile("9800000003")
            .area("Karol Bagh").isActive(true).kCoinsBalance(0)
            .latitude(28.6519).longitude(77.1909).preferredLanguage("en").build());

        // Active redemption for k1
        redemptionRepo.save(KCoinRedemption.builder()
            .kabadiWala(k1).coinsRedeemed(30)
            .selectedCommodity("Plastic")
            .validUntil(LocalDateTime.now().plusDays(1))
            .isActive(true).build());

        // Transactions
        saveTx(c1, k1, "PLASTIC", "2.5", "12.00");
        saveTx(c1, k1, "PAPER", "5.0", "8.00");
        saveTx(c2, k1, "METAL", "3.0", "45.00");
        saveTx(c2, k2, "PLASTIC", "4.0", "12.00");
        saveTx(c3, k2, "GLASS", "2.0", "5.00");
        saveTx(c3, k3, "E_WASTE", "1.5", "60.00");

        log.info("Demo data seeded successfully.");
    }

    private void saveTx(User user, KabadiWala kw, String material, String weight, String price) {
        BigDecimal w = new BigDecimal(weight);
        BigDecimal p = new BigDecimal(price);
        txRepo.save(WasteTransaction.builder()
            .user(user).kabadiWala(kw)
            .materialType(material)
            .weightKg(w).pricePerKg(p)
            .amountPaid(w.multiply(p))
            .build());
    }
}

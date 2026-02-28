package com.kabadi.service;

import com.kabadi.exception.BadRequestException;
import com.kabadi.model.dto.*;
import com.kabadi.model.entity.*;
import com.kabadi.repository.*;
import com.kabadi.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepo;
    private final KabadiWalaRepository kabadiRepo;
    private final AdminRepository adminRepo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    @Transactional
    public Map<String, Object> sendOtp(SendOtpRequest req) {
        String otp = generateOtp();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        log.info("OTP for {} ({}): {}", req.getMobile(), req.getUserType(), otp); // mock: logged

        if ("CITIZEN".equals(req.getUserType())) {
            User user = userRepo.findByMobile(req.getMobile())
                .orElse(User.builder().mobile(req.getMobile()).preferredLanguage("en").build());
            user.setOtpCode(otp);
            user.setOtpExpiresAt(expiry);
            userRepo.save(user);
            boolean isNew = user.getWasteRecyclerId() == null;
            return Map.of("otpSent", true, "isNewUser", isNew, "mockOtp", otp);
        } else {
            KabadiWala kw = kabadiRepo.findByMobile(req.getMobile())
                .orElse(KabadiWala.builder().mobile(req.getMobile()).preferredLanguage("en").build());
            kw.setOtpCode(otp);
            kw.setOtpExpiresAt(expiry);
            kabadiRepo.save(kw);
            boolean isNew = kw.getName() == null;
            return Map.of("otpSent", true, "isNewUser", isNew, "mockOtp", otp);
        }
    }

    @Transactional
    public Map<String, Object> verifyOtp(VerifyOtpRequest req) {
        if ("CITIZEN".equals(req.getUserType())) {
            User user = userRepo.findByMobile(req.getMobile())
                .orElseThrow(() -> new BadRequestException("User not found"));
            if (!req.getOtp().equals(user.getOtpCode()))
                throw new BadRequestException("Invalid OTP");
            if (user.getOtpExpiresAt().isBefore(LocalDateTime.now()))
                throw new BadRequestException("OTP expired");
            user.setOtpCode(null);
            userRepo.save(user);
            boolean isNew = user.getWasteRecyclerId() == null;
            String token = isNew ? null : jwtUtil.generateToken(
                user.getId(), "CITIZEN", user.getName(), user.getPreferredLanguage());
            return Map.of("isNewUser", isNew, "userId", user.getId(),
                "token", token != null ? token : "", "userType", "CITIZEN",
                "name", user.getName() != null ? user.getName() : "");
        } else {
            KabadiWala kw = kabadiRepo.findByMobile(req.getMobile())
                .orElseThrow(() -> new BadRequestException("Kabadi-wala not found"));
            if (!req.getOtp().equals(kw.getOtpCode()))
                throw new BadRequestException("Invalid OTP");
            if (kw.getOtpExpiresAt().isBefore(LocalDateTime.now()))
                throw new BadRequestException("OTP expired");
            kw.setOtpCode(null);
            kabadiRepo.save(kw);
            boolean isNew = kw.getName() == null;
            String token = isNew ? null : jwtUtil.generateToken(
                kw.getId(), "KABADI", kw.getName(), kw.getPreferredLanguage());
            return Map.of("isNewUser", isNew, "userId", kw.getId(),
                "token", token != null ? token : "", "userType", "KABADI",
                "name", kw.getName() != null ? kw.getName() : "");
        }
    }

    @Transactional
    public Map<String, Object> registerCitizen(CitizenRegisterRequest req) {
        User user = userRepo.findByMobile(req.getMobile())
            .orElseThrow(() -> new BadRequestException("Mobile not found. Please verify OTP first."));
        user.setName(req.getName());
        user.setAddressLine1(req.getAddressLine1());
        user.setAddressLine2(req.getAddressLine2());
        user.setPincode(req.getPincode());
        user.setPreferredLanguage(req.getPreferredLanguage() != null ? req.getPreferredLanguage() : "en");
        if (user.getWasteRecyclerId() == null) {
            user.setWasteRecyclerId(generateWasteRecyclerId());
        }
        userRepo.save(user);
        String token = jwtUtil.generateToken(user.getId(), "CITIZEN", user.getName(), user.getPreferredLanguage());
        return Map.of("token", token, "userId", user.getId(), "name", user.getName(),
            "wasteRecyclerId", user.getWasteRecyclerId(), "userType", "CITIZEN");
    }

    @Transactional
    public Map<String, Object> registerKabadi(KabadiRegisterRequest req) {
        KabadiWala kw = kabadiRepo.findByMobile(req.getMobile())
            .orElseThrow(() -> new BadRequestException("Mobile not found. Please verify OTP first."));
        kw.setName(req.getName());
        kw.setArea(req.getArea());
        kw.setPreferredLanguage(req.getPreferredLanguage() != null ? req.getPreferredLanguage() : "en");
        kabadiRepo.save(kw);
        String token = jwtUtil.generateToken(kw.getId(), "KABADI", kw.getName(), kw.getPreferredLanguage());
        return Map.of("token", token, "userId", kw.getId(), "name", kw.getName(), "userType", "KABADI");
    }

    public Map<String, Object> adminLogin(AdminLoginRequest req) {
        Admin admin = adminRepo.findByUsername(req.getUsername())
            .orElseThrow(() -> new BadRequestException("Invalid credentials"));
        if (!passwordEncoder.matches(req.getPassword(), admin.getPasswordHash()))
            throw new BadRequestException("Invalid credentials");
        String token = jwtUtil.generateToken(admin.getId(), "ADMIN", admin.getUsername(), "en");
        return Map.of("token", token, "userType", "ADMIN", "name", admin.getUsername());
    }

    private String generateWasteRecyclerId() {
        int year = java.time.Year.now().getValue();
        return "WR-" + year + "-" + String.format("%05d", new Random().nextInt(99999) + 1);
    }
}

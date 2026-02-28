package com.kabadi.controller;

import com.kabadi.model.dto.*;
import com.kabadi.model.response.ApiResponse;
import com.kabadi.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<?>> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("OTP sent successfully", authService.sendOtp(req)));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<?>> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("OTP verified", authService.verifyOtp(req)));
    }

    @PostMapping("/register/citizen")
    public ResponseEntity<ApiResponse<?>> registerCitizen(@Valid @RequestBody CitizenRegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", authService.registerCitizen(req)));
    }

    @PostMapping("/register/kabadi")
    public ResponseEntity<ApiResponse<?>> registerKabadi(@Valid @RequestBody KabadiRegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", authService.registerKabadi(req)));
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<?>> adminLogin(@RequestBody AdminLoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful", authService.adminLogin(req)));
    }
}

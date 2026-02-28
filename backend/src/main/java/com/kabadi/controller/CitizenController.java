package com.kabadi.controller;

import com.kabadi.model.response.ApiResponse;
import com.kabadi.service.CitizenService;
import com.kabadi.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/citizen")
@RequiredArgsConstructor
public class CitizenController {

    private final CitizenService citizenService;
    private final TransactionService txService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(citizenService.getProfile(userId)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(Authentication auth, @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", citizenService.updateProfile(userId, body)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<?>> getDashboard(Authentication auth,
            @RequestParam(required = false) String filter) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(citizenService.getDashboard(userId, filter)));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<?>> getTransactions(Authentication auth,
            @RequestParam(required = false) String filter) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(txService.getUserTransactions(userId, filter)));
    }

    @PutMapping("/language")
    public ResponseEntity<ApiResponse<?>> updateLanguage(Authentication auth,
            @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        citizenService.updateLanguage(userId, body.get("language"));
        return ResponseEntity.ok(ApiResponse.ok("Language updated", null));
    }
}

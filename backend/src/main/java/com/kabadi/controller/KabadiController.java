package com.kabadi.controller;

import com.kabadi.model.dto.RedeemRequest;
import com.kabadi.model.response.ApiResponse;
import com.kabadi.service.KabadiService;
import com.kabadi.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/kabadi")
@RequiredArgsConstructor
public class KabadiController {

    private final KabadiService kabadiService;
    private final TransactionService txService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(kabadiService.getProfile(id)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(Authentication auth, @RequestBody Map<String, String> body) {
        Long id = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", kabadiService.updateProfile(id, body)));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<?>> getDashboard(Authentication auth,
            @RequestParam(required = false) String filter) {
        Long id = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(kabadiService.getDashboard(id, filter)));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<?>> getTransactions(Authentication auth,
            @RequestParam(required = false) String filter) {
        Long id = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(txService.getKabadiTransactions(id, filter)));
    }

    @GetMapping("/kcoins")
    public ResponseEntity<ApiResponse<?>> getKCoins(Authentication auth) {
        Long id = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(kabadiService.getKCoins(id)));
    }

    @PostMapping("/kcoins/redeem")
    public ResponseEntity<ApiResponse<?>> redeemKCoins(Authentication auth, @RequestBody RedeemRequest req) {
        Long id = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Redemption successful", kabadiService.redeemKCoins(id, req)));
    }

    @GetMapping("/priority")
    public ResponseEntity<ApiResponse<?>> getPriority(@RequestParam double lat, @RequestParam double lng) {
        return ResponseEntity.ok(ApiResponse.ok(kabadiService.findPriority(lat, lng)));
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<?>> getNearby(@RequestParam double lat, @RequestParam double lng,
            @RequestParam(defaultValue = "2.0") double radius) {
        return ResponseEntity.ok(ApiResponse.ok(kabadiService.findNearby(lat, lng, radius)));
    }

    @PutMapping("/language")
    public ResponseEntity<ApiResponse<?>> updateLanguage(Authentication auth, @RequestBody Map<String, String> body) {
        Long id = (Long) auth.getPrincipal();
        kabadiService.updateLanguage(id, body.get("language"));
        return ResponseEntity.ok(ApiResponse.ok("Language updated", null));
    }
}

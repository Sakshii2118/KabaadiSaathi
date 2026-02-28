package com.kabadi.controller;

import com.kabadi.model.response.ApiResponse;
import com.kabadi.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<?>> getOverview() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getOverview()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<?>> getUsers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers()));
    }

    @GetMapping("/kabadis")
    public ResponseEntity<ApiResponse<?>> getKabadis() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllKabadis()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<?>> getTransactions() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllTransactions()));
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<?>> getConfig() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllConfig()));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<?>> updateConfig(@RequestBody Map<String, String> body) {
        String key = body.get("key");
        String value = body.get("value");
        return ResponseEntity.ok(ApiResponse.ok("Config updated", adminService.updateConfig(key, value)));
    }
}

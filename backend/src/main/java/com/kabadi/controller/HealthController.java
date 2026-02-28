package com.kabadi.controller;

import com.kabadi.model.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<?>> health() {
        return ResponseEntity.ok(ApiResponse.ok("Kabadi Backend is running",
            Map.of("status", "UP", "version", "1.0.0")));
    }
}

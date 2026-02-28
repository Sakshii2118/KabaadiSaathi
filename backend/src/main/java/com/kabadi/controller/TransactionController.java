package com.kabadi.controller;

import com.kabadi.model.dto.TransactionRequest;
import com.kabadi.model.response.ApiResponse;
import com.kabadi.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService txService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> logTransaction(@Valid @RequestBody TransactionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Transaction logged", txService.logTransaction(req)));
    }

    @GetMapping("/kabadi")
    public ResponseEntity<ApiResponse<?>> getKabadiTransactions(
            @RequestParam Long kabadiId,
            @RequestParam(required = false) String filter) {
        return ResponseEntity.ok(ApiResponse.ok(txService.getKabadiTransactions(kabadiId, filter)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<?>> getUserTransactions(
            @PathVariable Long userId,
            @RequestParam(required = false) String filter) {
        return ResponseEntity.ok(ApiResponse.ok(txService.getUserTransactions(userId, filter)));
    }
}

package com.kabadi.controller;

import com.kabadi.model.dto.BookingRequest;
import com.kabadi.model.dto.BookingUpdateRequest;
import com.kabadi.model.response.ApiResponse;
import com.kabadi.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createBooking(@RequestBody BookingRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Booking created", bookingService.createBooking(req)));
    }

    @GetMapping("/citizen")
    public ResponseEntity<ApiResponse<?>> getCitizenBookings(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getCitizenBookings(userId)));
    }

    @GetMapping("/kabadi")
    public ResponseEntity<ApiResponse<?>> getKabadiBookings(Authentication auth) {
        Long kabadiId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getKabadiBookings(kabadiId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateBooking(@PathVariable Long id, @RequestBody BookingUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Booking updated", bookingService.updateBooking(id, req)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated", bookingService.updateStatus(id, body.get("status"))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> cancelBooking(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        bookingService.cancelBooking(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled", null));
    }
}

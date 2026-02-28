package com.kabadi.service;

import com.kabadi.exception.BadRequestException;
import com.kabadi.exception.ResourceNotFoundException;
import com.kabadi.model.dto.BookingRequest;
import com.kabadi.model.dto.BookingUpdateRequest;
import com.kabadi.model.entity.*;
import com.kabadi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepo;
    private final UserRepository userRepo;

    @Transactional
    public Booking createBooking(BookingRequest req) {
        User user = userRepo.findById(req.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Default pickup address from user profile if not provided
        String pickupAddr = req.getPickupAddress();
        if (pickupAddr == null || pickupAddr.isBlank()) {
            pickupAddr = String.join(", ",
                user.getAddressLine1() != null ? user.getAddressLine1() : "",
                user.getAddressLine2() != null ? user.getAddressLine2() : "",
                user.getPincode() != null ? user.getPincode() : ""
            ).trim();
        }

        Booking booking = Booking.builder()
            .user(user)
            .pickupAddress(pickupAddr)
            .latitude(req.getLatitude())
            .longitude(req.getLongitude())
            .scheduledAt(req.getScheduledAt())
            .status("PENDING")
            .materialType(req.getMaterialType())
            .expectedWeightKg(req.getExpectedWeightKg())
            .build();
        return bookingRepo.save(booking);
    }

    public List<Booking> getCitizenBookings(Long userId) {
        return bookingRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Booking> getKabadiBookings(Long kabadiId) {
        return bookingRepo.findByKabadiWalaIdOrderByCreatedAtDesc(kabadiId);
    }

    @Transactional
    public Booking updateBooking(Long bookingId, BookingUpdateRequest req) {
        Booking booking = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!"PENDING".equals(booking.getStatus()))
            throw new BadRequestException("Only PENDING bookings can be edited");
        if (req.getMaterialType() != null) booking.setMaterialType(req.getMaterialType());
        if (req.getExpectedWeightKg() != null) booking.setExpectedWeightKg(req.getExpectedWeightKg());
        return bookingRepo.save(booking);
    }

    @Transactional
    public Booking updateStatus(Long bookingId, String status) {
        Booking booking = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!List.of("PENDING", "COMPLETED", "CANCELLED").contains(status))
            throw new BadRequestException("Invalid status: " + status);
        booking.setStatus(status);
        return bookingRepo.save(booking);
    }

    @Transactional
    public void cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!booking.getUser().getId().equals(userId))
            throw new BadRequestException("Unauthorized to cancel this booking");
        booking.setStatus("CANCELLED");
        bookingRepo.save(booking);
    }
}

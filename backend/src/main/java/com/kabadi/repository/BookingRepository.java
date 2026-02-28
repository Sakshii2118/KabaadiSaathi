package com.kabadi.repository;

import com.kabadi.model.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByKabadiWalaIdOrderByCreatedAtDesc(Long kabadiWalaId);
    List<Booking> findByUserIdAndStatus(Long userId, String status);
}

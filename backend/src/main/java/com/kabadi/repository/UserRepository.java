package com.kabadi.repository;

import com.kabadi.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByMobile(String mobile);
    boolean existsByMobile(String mobile);
    Optional<User> findByWasteRecyclerId(String wasteRecyclerId);
}

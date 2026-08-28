package com.example.hobbyquest_backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Used by Spring Security UserDetailsService to load user by email
    Optional<User> findByEmail(String email);

    // Used during registration to check if email already exists
    boolean existsByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    List<User> findByDailyReminderEnabledTrueAndReminderHourUtc(int reminderHourUtc);
}
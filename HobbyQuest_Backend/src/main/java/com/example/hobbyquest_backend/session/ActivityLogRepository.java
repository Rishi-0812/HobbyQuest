package com.example.hobbyquest_backend.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Optional<ActivityLog> findByUserIdAndActivityDate(Long userId, LocalDate date);

    // Last 84 days for the 12-week heatmap
    List<ActivityLog> findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(
            Long userId, LocalDate from, LocalDate to);

    // UPSERT — insert today's log or increment session_count if already exists
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO activity_log (user_id, activity_date, session_count)
        VALUES (:userId, :today, 1)
        ON CONFLICT (user_id, activity_date)
        DO UPDATE SET session_count = activity_log.session_count + 1
        """, nativeQuery = true)
    void upsertToday(@Param("userId") Long userId, @Param("today") LocalDate today);
}
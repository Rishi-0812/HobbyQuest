package com.example.hobbyquest_backend.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SessionLogRepository extends JpaRepository<SessionLog, Long> {

    // Last 5 sessions for skill detail screen history
    List<SessionLog> findTop5ByUserIdAndSkillIdOrderByLoggedAtDesc(Long userId, Long skillId);

    // Last 3 sessions to check for struggled tip trigger
    List<SessionLog> findTop3ByUserIdAndSkillIdOrderByLoggedAtDesc(Long userId, Long skillId);

    Optional<SessionLog> findTopByUserIdAndSkillIdOrderByLoggedAtDesc(Long userId, Long skillId);

    List<SessionLog> findTop5ByUserIdAndProjectIdOrderByLoggedAtDesc(Long userId, Long projectId);

    Optional<SessionLog> findTopByUserIdAndProjectIdOrderByLoggedAtDesc(Long userId, Long projectId);

    int countByUserIdAndProjectId(Long userId, Long projectId);

    @Query("SELECT COALESCE(SUM(s.xpEarned), 0) FROM SessionLog s WHERE s.userId = :userId AND s.projectId = :projectId")
    int sumXpEarnedByUserIdAndProjectId(@Param("userId") Long userId, @Param("projectId") Long projectId);

    // Cooldown check — any session logged for this skill in last 30 minutes
    @Query("""
        SELECT COUNT(s) > 0 FROM SessionLog s
        WHERE s.userId = :userId
          AND s.skillId = :skillId
          AND s.loggedAt > :cutoff
        """)
    boolean existsRecentSession(
            @Param("userId") Long userId,
            @Param("skillId") Long skillId,
            @Param("cutoff") LocalDateTime cutoff
    );

    // Daily XP already earned for this skill today (for 60 XP cap check)
    @Query("""
        SELECT COALESCE(SUM(s.xpEarned), 0) FROM SessionLog s
        WHERE s.userId = :userId
          AND s.skillId = :skillId
          AND s.loggedAt >= :startOfDay
        """)
    Integer sumXpEarnedTodayForSkill(
            @Param("userId") Long userId,
            @Param("skillId") Long skillId,
            @Param("startOfDay") LocalDateTime startOfDay
    );

    @Query("""
        SELECT COALESCE(SUM(s.xpEarned), 0) FROM SessionLog s
        WHERE s.userId = :userId
          AND s.projectId = :projectId
          AND s.loggedAt >= :startOfDay
        """)
    Integer sumXpEarnedTodayForProject(
            @Param("userId") Long userId,
            @Param("projectId") Long projectId,
            @Param("startOfDay") LocalDateTime startOfDay
    );

    // First session of the day check — any skill, for daily bonus
    @Query("""
        SELECT COUNT(s) > 0 FROM SessionLog s
        WHERE s.userId = :userId
          AND s.loggedAt >= :startOfDay
        """)
    boolean hasSessionTodayAnySkill(
            @Param("userId") Long userId,
            @Param("startOfDay") LocalDateTime startOfDay
    );

    @Query("""
        SELECT COUNT(s) > 0 FROM SessionLog s
        WHERE s.userId = :userId
          AND s.loggedAt >= :startOfDay
          AND s.loggedAt < :startOfNextDay
        """)
    boolean hasSessionBetween(
            @Param("userId") Long userId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("startOfNextDay") LocalDateTime startOfNextDay
    );
}

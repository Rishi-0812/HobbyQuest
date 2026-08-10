package com.example.hobbyquest_backend.session;

import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository        userRepository;

    /**
     * Called after every session log.
     * 1. UPSERTs today's activity_log row (increments session_count if exists)
     * 2. Checks if yesterday had activity
     * 3. Updates current_streak and longest_streak on the user
     * 4. Handles freeze consumption on missed days
     * Returns the updated streak count.
     */
    public StreakResult updateStreak(User user) {
        LocalDate today     = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // Always UPSERT today
        activityLogRepository.upsertToday(user.getId(), today);

        // Check if this is the first log today
        Optional<ActivityLog> todayLog = activityLogRepository
                .findByUserIdAndActivityDate(user.getId(), today);

        boolean firstLogToday = todayLog.isEmpty() ||
                todayLog.get().getSessionCount() <= 1;

        if (!firstLogToday) {
            // Not the first log today — streak already updated this session
            return StreakResult.builder()
                    .currentStreak(user.getCurrentStreak())
                    .longestStreak(user.getLongestStreak())
                    .streakBonusXp(0)
                    .build();
        }

        // First log of today — check if yesterday had activity
        boolean hadYesterday = activityLogRepository
                .findByUserIdAndActivityDate(user.getId(), yesterday)
                .isPresent();

        int streakBonusXp = 0;

        if (hadYesterday) {
            // Continue streak
            user.setCurrentStreak(user.getCurrentStreak() + 1);
        } else {
            // Missed yesterday — check freeze
            if (user.getStreakFreezeAvailable() != null && user.getStreakFreezeAvailable()) {
                // Consume freeze — streak preserved
                user.setStreakFreezeAvailable(false);
            } else {
                // No freeze — reset streak
                user.setCurrentStreak(1);
            }
        }

        // Update longest streak
        if (user.getCurrentStreak() > user.getLongestStreak()) {
            user.setLongestStreak(user.getCurrentStreak());
        }

        // Award streak milestone XP
        if (user.getCurrentStreak() == 7) {
            streakBonusXp = XPService.STREAK_7_BONUS;
            // Earn a freeze at 7-day streak if none held
            if (user.getStreakFreezeAvailable() == null || !user.getStreakFreezeAvailable()) {
                user.setStreakFreezeAvailable(true);
            }
        } else if (user.getCurrentStreak() == 30) {
            streakBonusXp = XPService.STREAK_30_BONUS;
        }

        userRepository.save(user);

        return StreakResult.builder()
                .currentStreak(user.getCurrentStreak())
                .longestStreak(user.getLongestStreak())
                .streakBonusXp(streakBonusXp)
                .build();
    }
}
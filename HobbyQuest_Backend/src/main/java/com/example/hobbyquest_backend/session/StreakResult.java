package com.example.hobbyquest_backend.session;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreakResult {
    private int currentStreak;
    private int longestStreak;
    private int streakBonusXp; // 0 unless a milestone was hit
}
package com.example.hobbyquest_backend.session;

import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class XPService {

    private final UserRepository userRepository;

    // XP thresholds per level — index = level - 1
    private static final int[] LEVEL_XP = {
            0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200
    };

    public static final int STREAK_7_BONUS  = 100;
    public static final int STREAK_30_BONUS = 500;
    public static final int LEVEL_COMPLETE  = 200;
    public static final int SKILL_COMPLETE  = 50;

    /**
     * Add XP to a user, recalculate level, save, and return result.
     * Call this once per event — don't call it multiple times per session log.
     * The caller aggregates total XP to add and calls this once.
     */
    public XPResult addXP(User user, int amount) {
        int oldLevel = user.getLevel();
        int newXp    = user.getXp() + amount;
        int newLevel = calculateLevel(newXp);

        user.setXp(newXp);
        user.setLevel(newLevel);
        userRepository.save(user);

        return XPResult.builder()
                .xpEarned(amount)
                .newTotalXp(newXp)
                .newLevel(newLevel)
                .leveledUp(newLevel > oldLevel)
                .build();
    }

    public int calculateLevel(int xp) {
        int level = 1;
        for (int i = 0; i < LEVEL_XP.length; i++) {
            if (xp >= LEVEL_XP[i]) level = i + 1;
        }
        return level;
    }
}
package com.example.hobbyquest_backend.session;

import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class XPService {

    private final UserRepository userRepository;

    private static final int[] LEVEL_XP = {
            0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200
    };

    public static final int STREAK_7_BONUS  = 100;
    public static final int STREAK_30_BONUS = 500;

    // Deprecated flat constants — no longer used by SkillService, which now
    // reads skill.getXpReward() (level-scaled) and a per-level bonus map
    // instead. Left in place only in case other code still references them.
    @Deprecated public static final int LEVEL_COMPLETE = 200;
    @Deprecated public static final int SKILL_COMPLETE  = 50;

    public static final int ROADMAP_COMPLETE_BONUS = 500;

    public static int levelCompletionBonus(String levelStage) {
        return switch (levelStage) {
            case "Basic" -> 100;
            case "Intermediate" -> 200;
            case "Advanced" -> 300;
            case "Mastery" -> 400;
            default -> 100;
        };
    }

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
package com.example.hobbyquest_backend.skill;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionLogResponse {
    private int     sessionXp;
    private int     dailyBonus;
    private int     completionBonus;
    private int     levelBonus;
    private int     streakBonus;
    private int     totalXpEarned;
    private int     newTotalXp;
    private int     newLevel;
    private boolean leveledUp;
    private int     currentStreak;

    // Project-specific fields (null/absent for structured-skill sessions)
    private Integer currentCount;
    private Integer targetCount;
    private Boolean projectJustCompleted;
    private Integer unitsAppliedThisSession;

    private boolean skillJustCompleted;
    private boolean levelJustCompleted;
    private String  completedLevel;
    private int     totalSkills;
    private long    daysTaken;
    private String  newSkillStatus;
}
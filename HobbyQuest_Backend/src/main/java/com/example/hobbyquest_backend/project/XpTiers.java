package com.example.hobbyquest_backend.project;

public class XpTiers {

    // Generation-time cap for NEW projects — legacy content may exceed this,
    // grandfathered rather than retroactively shrunk.
    public static final int MAX_GENERATED_TARGET_COUNT = 40;

    // Valid [min, max] range Gemini's suggested unit_xp must fall within,
    // used to validate/clamp on approval. Never trust Gemini's number raw.
    public static int[] validRangeForTargetCount(int targetCount) {
        if (targetCount <= 5)  return new int[]{25, 40};
        if (targetCount <= 10) return new int[]{20, 30};
        if (targetCount <= 20) return new int[]{15, 25};
        if (targetCount <= 30) return new int[]{12, 20};
        if (targetCount <= 40) return new int[]{10, 15};
        // Legacy-only extension, beyond the spec's defined range:
        if (targetCount <= 60) return new int[]{7, 10};
        return new int[]{5, 8};
    }

    // Fixed mid-range value for custom (user-created) projects — no Gemini
    // judgment involved, so no range to choose within, just a flat default.
    public static int customProjectUnitXp(int targetCount) {
        if (targetCount <= 5)  return 32;
        if (targetCount <= 10) return 25;
        if (targetCount <= 20) return 20;
        if (targetCount <= 30) return 16;
        if (targetCount <= 40) return 12;
        if (targetCount <= 60) return 8;
        return 6;
    }

    public static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
package com.example.hobbyquest_backend.skill;

import com.example.hobbyquest_backend.progress.UserSkillProgress;
import com.example.hobbyquest_backend.progress.UserSkillProgressRepository;
import com.example.hobbyquest_backend.project.XpBreakdownItem;
import com.example.hobbyquest_backend.session.*;
import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository              skillRepository;
    private final UserSkillProgressRepository  progressRepository;
    private final SessionLogRepository         sessionLogRepository;
    private final ActivityLogRepository        activityLogRepository;
    private final XPService                    xpService;
    private final StreakService                streakService;
    private final UserRepository               userRepository;

    private static final int DAILY_XP_CAP_PER_SKILL = 90; // was 60
    private static final int COOLDOWN_MINUTES        = 10;

    // ─── Roadmap ─────────────────────────────────────────────────────────────

    public RoadmapResponse getRoadmap(Long hobbyId, Long userId) {
        List<Skill> allSkills = skillRepository
                .findByHobbyIdOrderByLevelStageAscOrderIndexAsc(hobbyId);

        List<UserSkillProgress> allProgress = progressRepository
                .findByUserIdAndHobbyId(userId, hobbyId);

        // Map skillId → progress for quick lookup
        Map<Long, UserSkillProgress> progressMap = allProgress.stream()
                .collect(Collectors.toMap(UserSkillProgress::getSkillId, p -> p));

        // Group skills by level in display order
        List<String> levelOrder = List.of("Basic", "Intermediate", "Advanced", "Mastery");

        List<RoadmapLevelResponse> levels = levelOrder.stream().map(level -> {
            List<Skill> levelSkills = allSkills.stream()
                    .filter(s -> level.equals(s.getLevelStage()))
                    .sorted(Comparator.comparingInt(Skill::getOrderIndex))
                    .toList();

            List<SkillSummaryResponse> skillSummaries = levelSkills.stream().map(skill -> {
                UserSkillProgress prog = progressMap.get(skill.getId());
                String status = determineDisplayStatus(skill, prog, progressMap, allSkills);
                return SkillSummaryResponse.builder()
                        .skillId(skill.getId())
                        .name(skill.getName())
                        .status(status)
                        .attemptCount(prog != null ? prog.getAttemptCount() : 0)
                        .orderIndex(skill.getOrderIndex())
                        .build();
            }).toList();

            long completed = levelSkills.stream()
                    .filter(s -> "COMPLETED".equals(
                            progressMap.containsKey(s.getId())
                                    ? progressMap.get(s.getId()).getStatus() : "LOCKED"))
                    .count();

            return RoadmapLevelResponse.builder()
                    .level(level)
                    .skills(skillSummaries)
                    .completedCount((int) completed)
                    .totalCount(levelSkills.size())
                    .build();
        }).filter(l -> !l.getSkills().isEmpty()).toList();

        return RoadmapResponse.builder().levels(levels).build();
    }

    private String determineDisplayStatus(
            Skill skill,
            UserSkillProgress prog,
            Map<Long, UserSkillProgress> progressMap,
            List<Skill> allSkills
    ) {
        // If progress row exists, return its status
        if (prog != null) return prog.getStatus();

        // No progress row — check if unlocked
        if (skill.getOrderIndex() == 1) {
            // First skill in level — check level access
            if ("Basic".equals(skill.getLevelStage())) return "AVAILABLE";
            // For other levels, need previous level fully complete
            String prevLevel = previousLevel(skill.getLevelStage());
            boolean prevLevelDone = allSkills.stream()
                    .filter(s -> prevLevel.equals(s.getLevelStage()))
                    .allMatch(s -> {
                        UserSkillProgress p = progressMap.get(s.getId());
                        return p != null && "COMPLETED".equals(p.getStatus());
                    });
            return prevLevelDone ? "AVAILABLE" : "LOCKED";
        }

        // Check if previous skill in same level is completed
        Optional<Skill> prev = allSkills.stream()
                .filter(s -> s.getLevelStage().equals(skill.getLevelStage())
                        && s.getOrderIndex() == skill.getOrderIndex() - 1)
                .findFirst();

        if (prev.isEmpty()) return "LOCKED";
        UserSkillProgress prevProg = progressMap.get(prev.get().getId());
        return (prevProg != null && "COMPLETED".equals(prevProg.getStatus()))
                ? "AVAILABLE" : "LOCKED";
    }

    private String previousLevel(String level) {
        return switch (level) {
            case "Intermediate" -> "Basic";
            case "Advanced"     -> "Intermediate";
            case "Mastery"      -> "Advanced";
            default             -> "Basic";
        };
    }

    // ─── Skill detail ─────────────────────────────────────────────────────────

    public SkillDetailResponse getSkillDetail(Long skillId, Long userId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));

        Optional<UserSkillProgress> prog = progressRepository
                .findByUserIdAndSkillId(userId, skillId);

        // Check struggled tip
        List<SessionLog> last3 = sessionLogRepository
                .findTop3ByUserIdAndSkillIdOrderByLoggedAtDesc(userId, skillId);
        boolean showStruggledTip = last3.size() == 3 &&
                last3.stream().allMatch(s -> "STRUGGLING".equals(s.getVibe()));

        // Last 5 sessions for history display
        List<SessionLog> last5 = sessionLogRepository
                .findTop5ByUserIdAndSkillIdOrderByLoggedAtDesc(userId, skillId);
        long cooldownRemainingMs = calculateCooldownRemainingMs(userId, skillId);

        return SkillDetailResponse.builder()
                .skillId(skill.getId())
                .name(skill.getName())
                .description(skill.getDescription())
                .tip(showStruggledTip ? skill.getStruggledTip() : skill.getTip())
                .isStruggledTip(showStruggledTip)
                .status(prog.map(UserSkillProgress::getStatus).orElse("AVAILABLE"))
                .attemptCount(prog.map(UserSkillProgress::getAttemptCount).orElse(0))
                .cooldownRemainingMs(cooldownRemainingMs)
                .recentSessions(last5)
                .build();
    }

    private long calculateCooldownRemainingMs(Long userId, Long skillId) {
        return sessionLogRepository.findTopByUserIdAndSkillIdOrderByLoggedAtDesc(userId, skillId)
                .map(last -> {
                    LocalDateTime availableAt = last.getLoggedAt().plusMinutes(COOLDOWN_MINUTES);
                    long remaining = Duration.between(LocalDateTime.now(), availableAt).toMillis();
                    return Math.max(0, remaining);
                })
                .orElse(0L);
    }

    // Log session ──────────────────────────────────────────────────────────


// ...

    @Transactional
    public SessionLogResponse logSession(Long skillId, Long userId, User user,
                                         String vibe, String note) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));

        LocalDateTime cooldownCutoff = LocalDateTime.now().minusMinutes(COOLDOWN_MINUTES);
        boolean onCooldown = sessionLogRepository.existsRecentSession(userId, skillId, cooldownCutoff);
        if (onCooldown) {
            throw new RuntimeException("Please wait 10 minutes before logging another session for this skill");
        }

        List<XpBreakdownItem> breakdown = new ArrayList<>();
        List<String> highlightLabels = new ArrayList<>();

        LocalDateTime startOfDay = LocalDate.now().atTime(LocalTime.MIDNIGHT);
        int sessionXp = vibeToXp(vibe);
        boolean isFirstSessionToday = !sessionLogRepository.hasSessionTodayAnySkill(userId, startOfDay);
        int dailyBonus = isFirstSessionToday ? 30 : 0;

        int xpEarnedTodayForSkill = sessionLogRepository.sumXpEarnedTodayForSkill(userId, skillId, startOfDay);
        int cappedSessionTotal = sessionXp + dailyBonus;

        if (xpEarnedTodayForSkill >= DAILY_XP_CAP_PER_SKILL) {
            sessionXp = 0; dailyBonus = 0; cappedSessionTotal = 0;
        } else if (xpEarnedTodayForSkill + cappedSessionTotal > DAILY_XP_CAP_PER_SKILL) {
            int awardable = DAILY_XP_CAP_PER_SKILL - xpEarnedTodayForSkill;
            dailyBonus = Math.min(dailyBonus, awardable);
            sessionXp = Math.max(0, awardable - dailyBonus);
            cappedSessionTotal = sessionXp + dailyBonus;
        }

        if (sessionXp > 0) breakdown.add(new XpBreakdownItem(vibeLabel(vibe), sessionXp));
        if (dailyBonus > 0) breakdown.add(new XpBreakdownItem("Daily bonus", dailyBonus));

        int totalXpToAdd = cappedSessionTotal;

        UserSkillProgress prog = progressRepository
                .findByUserIdAndSkillId(userId, skillId)
                .orElseGet(() -> UserSkillProgress.builder()
                        .userId(userId).skillId(skillId).hobbyId(skill.getHobbyId())
                        .firstAttemptedAt(LocalDateTime.now())
                        .build());

        prog.setAttemptCount(prog.getAttemptCount() + 1);

        if (prog.getStatus() == null || "AVAILABLE".equals(prog.getStatus())) {
            prog.setStatus("LEARNING");
        }

        boolean skillJustCompleted = false;
        int completionBonus = 0;

        if ("ALMOST_THERE".equals(prog.getStatus()) && "NAILED_IT".equals(vibe)) {
            prog.setStatus("COMPLETED");
            prog.setCompletedAt(LocalDateTime.now());
            skillJustCompleted = true;
            completionBonus = skill.getXpReward();
            totalXpToAdd += completionBonus;
            breakdown.add(new XpBreakdownItem("Skill complete", completionBonus));
            highlightLabels.add("Skill complete");
        }

        progressRepository.save(prog);

        boolean levelJustCompleted = false;
        boolean roadmapJustCompleted = false;
        int levelBonus = 0;
        int roadmapBonus = 0;
        String completedLevel = null;
        int totalSkills = 0;
        long daysTaken = 0;

        if (skillJustCompleted) {
            List<Skill> levelSkills = skillRepository
                    .findByHobbyIdAndLevelStageOrderByOrderIndexAsc(skill.getHobbyId(), skill.getLevelStage());
            List<Skill> allHobbySkills = skillRepository
                    .findByHobbyIdOrderByLevelStageAscOrderIndexAsc(skill.getHobbyId());
            totalSkills = allHobbySkills.size();

            List<UserSkillProgress> hobbyProgress = progressRepository.findByUserIdAndHobbyId(userId, skill.getHobbyId());
            Map<Long, String> statusMap = hobbyProgress.stream()
                    .collect(Collectors.toMap(UserSkillProgress::getSkillId, UserSkillProgress::getStatus));

            boolean levelAllDone = levelSkills.stream()
                    .allMatch(s -> "COMPLETED".equals(statusMap.get(s.getId())));

            if (levelAllDone) {
                levelJustCompleted = true;
                completedLevel = skill.getLevelStage();
                levelBonus = XPService.levelCompletionBonus(completedLevel);
                totalXpToAdd += levelBonus;
                breakdown.add(new XpBreakdownItem(completedLevel + " level complete", levelBonus));
                highlightLabels.add(completedLevel + " level complete");

                long completedCount = allHobbySkills.stream()
                        .filter(s -> "COMPLETED".equals(statusMap.get(s.getId())))
                        .count();
                if (completedCount == totalSkills) {
                    roadmapJustCompleted = true;
                    roadmapBonus = XPService.ROADMAP_COMPLETE_BONUS;
                    totalXpToAdd += roadmapBonus;
                    breakdown.add(new XpBreakdownItem("Roadmap complete", roadmapBonus));
                    highlightLabels.add("Roadmap complete");
                }
            }

            daysTaken = hobbyProgress.stream()
                    .map(UserSkillProgress::getFirstAttemptedAt)
                    .filter(Objects::nonNull)
                    .min(LocalDateTime::compareTo)
                    .map(first -> Math.max(1L, Duration.between(first, LocalDateTime.now()).toDays() + 1))
                    .orElse(1L);
        }

        XPResult xpResult = xpService.addXP(user, totalXpToAdd);
        StreakResult streak = streakService.updateStreak(user);

        if (streak.getStreakBonusXp() > 0) {
            xpResult = xpService.addXP(user, streak.getStreakBonusXp());
            breakdown.add(new XpBreakdownItem("Streak bonus", streak.getStreakBonusXp()));
            highlightLabels.add("Streak bonus");
        }

        // Saved at the end, now that the full picture is known — xpEarned keeps
        // its original meaning (capped vibe+bonus, used for cap-sum queries),
        // bonusXp captures everything else, highlights is a short display label.
        int bonusXpTotal = completionBonus + levelBonus + roadmapBonus + streak.getStreakBonusXp();
        SessionLog log = SessionLog.builder()
                .userId(userId)
                .skillId(skillId)
                .vibe(vibe)
                .note(note)
                .xpEarned(cappedSessionTotal)
                .bonusXp(bonusXpTotal)
                .highlights(highlightLabels.isEmpty() ? null : String.join(", ", highlightLabels))
                .build();
        sessionLogRepository.save(log);

        return SessionLogResponse.builder()
                .sessionXp(sessionXp)
                .dailyBonus(dailyBonus)
                .completionBonus(completionBonus)
                .levelBonus(levelBonus)
                .streakBonus(streak.getStreakBonusXp())
                .totalXpEarned(totalXpToAdd + streak.getStreakBonusXp())
                .newTotalXp(xpResult.getNewTotalXp())
                .newLevel(xpResult.getNewLevel())
                .leveledUp(xpResult.isLeveledUp())
                .currentStreak(streak.getCurrentStreak())
                .skillJustCompleted(skillJustCompleted)
                .levelJustCompleted(levelJustCompleted)
                .roadmapJustCompleted(roadmapJustCompleted)
                .completedLevel(completedLevel)
                .totalSkills(totalSkills)
                .daysTaken(daysTaken)
                .newSkillStatus(prog.getStatus())
                .xpBreakdown(breakdown)
                .build();
    }

    private int vibeToXp(String vibe) {
        return switch (vibe) {
            case "NAILED_IT" -> 40;
            case "GETTING_THE_HANG_OF_IT" -> 30;
            default -> 20; // STRUGGLING
        };
    }

    private String vibeLabel(String vibe) {
        return switch (vibe) {
            case "NAILED_IT" -> "Nailed it";
            case "GETTING_THE_HANG_OF_IT" -> "Making progress";
            default -> "Struggled";
        };
    }

    // ─── Status upgrade (LEARNING → ALMOST_THERE, manual) ────────────────────

    @Transactional
    public UpgradeResponse upgradeStatus(Long skillId, Long userId) {
        UserSkillProgress prog = progressRepository
                .findByUserIdAndSkillId(userId, skillId)
                .orElseThrow(() -> new RuntimeException("No progress found for this skill"));

        if (!"LEARNING".equals(prog.getStatus())) {
            throw new RuntimeException("Skill is not in LEARNING status");
        }

        prog.setStatus("ALMOST_THERE");
        progressRepository.save(prog);

        return UpgradeResponse.builder()
                .newStatus("ALMOST_THERE")
                .message("Marked as Almost There — log a Nailed It session to complete this skill")
                .build();
    }
}
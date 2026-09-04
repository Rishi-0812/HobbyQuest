package com.example.hobbyquest_backend.project;

import com.example.hobbyquest_backend.hobby.Hobby;
import com.example.hobbyquest_backend.hobby.HobbyRepository;
import com.example.hobbyquest_backend.progress.UserProjectProgress;
import com.example.hobbyquest_backend.progress.UserProjectProgressRepository;
import com.example.hobbyquest_backend.session.*;
import com.example.hobbyquest_backend.skill.SessionLogResponse;
import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final int COOLDOWN_MINUTES = 10;
    private static final int DAILY_XP_CAP_PER_PROJECT = 90; // matches structured skill cap

    private final ProjectRepository projectRepository;
    private final ProjectUnitRepository projectUnitRepository;
    private final UserProjectProgressRepository progressRepository;
    private final HobbyRepository hobbyRepository;
    private final SessionLogRepository sessionLogRepository;
    private final XPService xpService;
    private final StreakService streakService;
    private final UserRepository userRepository;

    private static final int MAX_ACTIVE_PROJECTS = 2;

    private void checkActiveProjectCap(Long userId) {
        List<UserProjectProgress> activeProgress = progressRepository
                .findByUserIdAndStatusAndIsCompleteFalse(userId, "ACTIVE");
        if (activeProgress.size() >= MAX_ACTIVE_PROJECTS) {
            String names = activeProgress.stream()
                    .map(p -> projectRepository.findById(p.getProjectId()).map(Project::getName).orElse("a project"))
                    .collect(Collectors.joining(", "));
            throw new RuntimeException("You already have 2 active projects (" + names + "). Complete or abandon one before starting another.");
        }
    }

    public List<ProjectResponse> getProjectsForHobby(Long hobbyId, Long userId) {
        Map<Long, UserProjectProgress> progressByProject = progressRepository
                .findByUserIdAndHobbyId(userId, hobbyId)
                .stream()
                .collect(Collectors.toMap(UserProjectProgress::getProjectId, p -> p));

        return projectRepository.findByHobbyId(hobbyId).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsPublic()) || userId.equals(p.getCreatedBy()))
                .map(project -> toResponse(project, progressByProject.get(project.getId())))
                .toList();
    }

    @Transactional
    public Long enrolInProject(Long projectId, Long userId) {
        var existing = progressRepository.findByUserIdAndProjectId(userId, projectId);

        if (existing.isPresent()) {
            UserProjectProgress progress = existing.get();
            if ("ACTIVE".equals(progress.getStatus())) {
                return progress.getId();
            }
            checkActiveProjectCap(userId);
            progress.setStatus("ACTIVE");
            progress.setStartedAt(LocalDateTime.now());
            progressRepository.save(progress);
            return progress.getId();
        }

        checkActiveProjectCap(userId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        UserProjectProgress progress = UserProjectProgress.builder()
                .userId(userId)
                .projectId(project.getId())
                .hobbyId(project.getHobbyId())
                .currentCount(0)
                .isComplete(false)
                .startedAt(LocalDateTime.now())
                .status("ACTIVE")
                .build();
        return progressRepository.save(progress).getId();
    }

    @Transactional
    public CustomProjectResponse createCustomProject(CustomProjectRequest req, Long userId) {
        validateCustomProject(req);
        checkActiveProjectCap(userId);

        List<Project> suggestions = projectRepository.findSimilarByHobbyAndName(req.getHobbyId(), req.getName().trim());
        if (!suggestions.isEmpty() && !Boolean.TRUE.equals(req.getForceCreate())) {
            return CustomProjectResponse.builder()
                    .suggestions(suggestions.stream().map(p -> toResponse(p, null)).toList())
                    .progressId(null)
                    .build();
        }

        Hobby hobby = hobbyRepository.findById(req.getHobbyId())
                .orElseThrow(() -> new RuntimeException("Hobby not found"));
        if (!"passion".equalsIgnoreCase(hobby.getType())) {
            throw new RuntimeException("Projects are only available for passion hobbies");
        }

        // Custom (user-created) projects never let Gemini or the user pick XP —
        // fixed mid-range value from the target_count tier, same principle as
        // generated content: the backend controls the XP economy, always.
        int unitXp = XpTiers.customProjectUnitXp(req.getTargetCount());

        Project project = Project.builder()
                .hobbyId(req.getHobbyId())
                .name(req.getName().trim())
                .description(req.getDescription())
                .targetCount(req.getTargetCount())
                .unitLabel(req.getUnitLabel().trim())
                .unitLabelPlural(req.getUnitLabel().trim() + "s")
                .source(Boolean.TRUE.equals(req.getIsPublic()) ? "community" : "custom")
                .isPublic(req.getIsPublic() == null || req.getIsPublic())
                .createdBy(userId)
                .durationDays(req.getDurationDays())
                .unitXp(unitXp)
                .completionBonusXp(300)
                .build();
        Project saved = projectRepository.save(project);

        if (req.getUnitNames() != null) {
            for (int i = 0; i < Math.min(req.getUnitNames().size(), req.getTargetCount()); i++) {
                String unitName = req.getUnitNames().get(i);
                if (unitName != null && !unitName.isBlank()) {
                    projectUnitRepository.save(ProjectUnit.builder()
                            .projectId(saved.getId())
                            .unitNumber(i + 1)
                            .name(unitName.trim())
                            .creativePrompt(unitName.trim())
                            .build());
                }
            }
        }

        return CustomProjectResponse.builder()
                .suggestions(List.of())
                .progressId(enrolInProject(saved.getId(), userId))
                .build();
    }

    public ActiveProjectResponse getActiveProject(Long progressId, Long userId) {
        UserProjectProgress progress = progressRepository.findByIdAndUserId(progressId, userId)
                .orElseThrow(() -> new RuntimeException("Project progress not found"));
        Project project = projectRepository.findById(progress.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        String prompt = projectUnitRepository
                .findByProjectIdAndUnitNumber(project.getId(), progress.getCurrentCount() + 1)
                .map(unit -> unit.getCreativePrompt() != null && !unit.getCreativePrompt().isBlank()
                        ? unit.getCreativePrompt() : unit.getName())
                .orElse("Complete unit " + (progress.getCurrentCount() + 1) + " of " + project.getTargetCount());

        String nextPrompt = null;
        if (progress.getCurrentCount() + 2 <= project.getTargetCount()) {
            nextPrompt = projectUnitRepository
                    .findByProjectIdAndUnitNumber(project.getId(), progress.getCurrentCount() + 2)
                    .map(unit -> unit.getCreativePrompt() != null && !unit.getCreativePrompt().isBlank()
                            ? unit.getCreativePrompt() : unit.getName())
                    .orElse("Complete unit " + (progress.getCurrentCount() + 2) + " of " + project.getTargetCount());
        }

        Boolean isOverdue = null;
        if (project.getDurationDays() != null && progress.getStartedAt() != null) {
            LocalDateTime deadline = progress.getStartedAt().plusDays(project.getDurationDays());
            isOverdue = LocalDateTime.now().isAfter(deadline);
        }

        int sessionsLogged = sessionLogRepository.countByUserIdAndProjectId(userId, project.getId());
        int vibeXpSum = sessionLogRepository.sumXpEarnedByUserIdAndProjectId(userId, project.getId());
        int unitXpEach = resolveUnitXp(project);
        int unitXpSum = progress.getCurrentCount() * unitXpEach;
        int completionBonusSum = Boolean.TRUE.equals(progress.getIsComplete())
                ? resolveCompletionBonus(project) : 0;
        int totalXpEarned = vibeXpSum + unitXpSum + completionBonusSum;

        return ActiveProjectResponse.builder()
                .progressId(progress.getId())
                .projectId(project.getId())
                .projectName(project.getName())
                .unitLabel(project.getUnitLabel())
                .targetCount(project.getTargetCount())
                .currentCount(progress.getCurrentCount())
                .isComplete(progress.getIsComplete())
                .currentPrompt(prompt)
                .nextPrompt(nextPrompt)
                .cooldownRemainingMs(calculateCooldownRemainingMs(userId, project.getId()))
                .recentSessions(sessionLogRepository.findTop5ByUserIdAndProjectIdOrderByLoggedAtDesc(userId, project.getId()))
                .isOverdue(isOverdue)
                .sessionsLogged(sessionsLogged)
                .totalXpEarned(totalXpEarned)
                .build();
    }

    @Transactional
    public SessionLogResponse logSession(Long progressId, String vibe, String note, Integer completedUnits, Long userId) {
        UserProjectProgress progress = progressRepository.findByIdAndUserId(progressId, userId)
                .orElseThrow(() -> new RuntimeException("Project progress not found"));
        Project project = projectRepository.findById(progress.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        long cooldown = calculateCooldownRemainingMs(userId, project.getId());
        if (cooldown > 0) {
            throw new RuntimeException("Please wait before logging another session for this project");
        }

        List<XpBreakdownItem> breakdown = new ArrayList<>();
        List<String> highlightLabels = new ArrayList<>();

        LocalDateTime startOfDay = LocalDate.now().atTime(LocalTime.MIDNIGHT);
        int sessionXp = vibeToXp(vibe);
        boolean isFirstSessionToday = !sessionLogRepository.hasSessionTodayAnySkill(userId, startOfDay);
        int dailyBonus = isFirstSessionToday ? 30 : 0;
        int vibeTotal = sessionXp + dailyBonus;

        int earnedToday = sessionLogRepository.sumXpEarnedTodayForProject(userId, project.getId(), startOfDay);
        if (earnedToday >= DAILY_XP_CAP_PER_PROJECT) {
            sessionXp = 0; dailyBonus = 0; vibeTotal = 0;
        } else if (earnedToday + vibeTotal > DAILY_XP_CAP_PER_PROJECT) {
            int awardable = DAILY_XP_CAP_PER_PROJECT - earnedToday;
            dailyBonus = Math.min(dailyBonus, awardable);
            sessionXp = Math.max(0, awardable - dailyBonus);
            vibeTotal = sessionXp + dailyBonus;
        }

        if (sessionXp > 0) breakdown.add(new XpBreakdownItem(vibeLabel(vibe), sessionXp));
        if (dailyBonus > 0) breakdown.add(new XpBreakdownItem("Daily bonus", dailyBonus));

        xpService.addXP(user, vibeTotal);

        StreakResult streak = streakService.updateStreak(user);
        if (streak.getStreakBonusXp() > 0) {
            xpService.addXP(user, streak.getStreakBonusXp());
            breakdown.add(new XpBreakdownItem("Streak bonus", streak.getStreakBonusXp()));
            highlightLabels.add("Streak bonus");
        }

        int requestedUnits = completedUnits == null ? 0 : Math.max(0, completedUnits);
        int remaining = project.getTargetCount() - progress.getCurrentCount();
        int maxAllowedThisSession = Math.min(2, Math.max(0, remaining));
        int appliedUnits = Math.min(requestedUnits, maxAllowedThisSession);
        progress.setCurrentCount(progress.getCurrentCount() + appliedUnits);

        int unitXpEach = resolveUnitXp(project);
        int unitXp = appliedUnits * unitXpEach;
        if (unitXp > 0) {
            xpService.addXP(user, unitXp);
            String label = appliedUnits == 1
                    ? (project.getUnitLabel() != null ? project.getUnitLabel() : "unit")
                    : (project.getUnitLabelPlural() != null ? project.getUnitLabelPlural() : "units");
            String unitHighlight = appliedUnits + " " + label + " completed";
            breakdown.add(new XpBreakdownItem(unitHighlight, unitXp));
            highlightLabels.add(unitHighlight);
        }

        boolean justCompleted = false;
        int completionBonus = 0;
        if (!Boolean.TRUE.equals(progress.getIsComplete()) && progress.getCurrentCount() >= project.getTargetCount()) {
            progress.setIsComplete(true);
            progress.setStatus("COMPLETED");
            justCompleted = true;
            completionBonus = resolveCompletionBonus(project);
            xpService.addXP(user, completionBonus);
            breakdown.add(new XpBreakdownItem("Project complete", completionBonus));
            highlightLabels.add("Project complete");
        }

        progressRepository.save(progress);

        int totalXpThisSession = vibeTotal + unitXp + completionBonus + streak.getStreakBonusXp();
        User fresh = userRepository.findById(userId).orElse(user);

        int bonusXpTotal = unitXp + completionBonus + streak.getStreakBonusXp();
        sessionLogRepository.save(SessionLog.builder()
                .userId(userId)
                .projectId(project.getId())
                .vibe(vibe)
                .note(note)
                .xpEarned(vibeTotal)
                .bonusXp(bonusXpTotal)
                .highlights(highlightLabels.isEmpty() ? null : String.join(", ", highlightLabels))
                .build());

        return SessionLogResponse.builder()
                .sessionXp(sessionXp)
                .dailyBonus(dailyBonus)
                .completionBonus(completionBonus)
                .streakBonus(streak.getStreakBonusXp())
                .totalXpEarned(totalXpThisSession)
                .newTotalXp(fresh.getXp())
                .newLevel(fresh.getLevel())
                .leveledUp(false)
                .currentStreak(streak.getCurrentStreak())
                .currentCount(progress.getCurrentCount())
                .targetCount(project.getTargetCount())
                .projectJustCompleted(justCompleted)
                .unitsAppliedThisSession(appliedUnits)
                .xpBreakdown(breakdown)
                .build();
    }

    private int resolveUnitXp(Project project) {
        // Fallback for any project that somehow never got a value set (shouldn't
        // happen post-migration, but defends against a missed backfill row).
        return project.getUnitXp() != null ? project.getUnitXp() : XpTiers.customProjectUnitXp(project.getTargetCount());
    }

    private int resolveCompletionBonus(Project project) {
        return project.getCompletionBonusXp() != null ? project.getCompletionBonusXp() : 300;
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
            case "GETTING_THE_HANG_OF_IT" -> "Kept at it";
            default -> "Showed up anyway";
        };
    }

    private ProjectResponse toResponse(Project project, UserProjectProgress progress) {
        String progressStatus = progress == null
                ? null
                : (Boolean.TRUE.equals(progress.getIsComplete()) ? "COMPLETED" : progress.getStatus());
        boolean activelyEnrolled = "ACTIVE".equals(progressStatus);
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .targetCount(project.getTargetCount())
                .unitLabel(project.getUnitLabel())
                .unitLabelPlural(project.getUnitLabelPlural())
                .source(project.getSource())
                .isPublic(project.getIsPublic())
                .isEnrolled(activelyEnrolled)
                .currentCount(progress != null ? progress.getCurrentCount() : 0)
                .progressId(progress != null ? progress.getId() : null)
                .status(progressStatus)
                .startedAt(progress != null ? progress.getStartedAt() : null)
                .build();
    }

    private long calculateCooldownRemainingMs(Long userId, Long projectId) {
        return sessionLogRepository.findTopByUserIdAndProjectIdOrderByLoggedAtDesc(userId, projectId)
                .map(last -> Math.max(0, Duration.between(LocalDateTime.now(), last.getLoggedAt().plusMinutes(COOLDOWN_MINUTES)).toMillis()))
                .orElse(0L);
    }

    private void validateCustomProject(CustomProjectRequest req) {
        if (req.getHobbyId() == null) throw new RuntimeException("Hobby is required");
        if (req.getName() == null || req.getName().isBlank()) throw new RuntimeException("Project name is required");
        if (req.getTargetCount() == null || req.getTargetCount() < 1) throw new RuntimeException("Target count is required");
        if (req.getTargetCount() > XpTiers.MAX_GENERATED_TARGET_COUNT) {
            throw new RuntimeException("Custom projects can have at most " + XpTiers.MAX_GENERATED_TARGET_COUNT + " units.");
        }
        if (req.getUnitLabel() == null || req.getUnitLabel().isBlank()) throw new RuntimeException("Unit label is required");
    }

    @Transactional
    public void abandonProject(Long progressId, Long userId) {
        UserProjectProgress progress = progressRepository.findByIdAndUserId(progressId, userId)
                .orElseThrow(() -> new RuntimeException("Project progress not found"));
        progress.setStatus("ABANDONED");
        progressRepository.save(progress);
    }

    public List<ProjectResponse> findSimilarProjects(Long hobbyId, String name) {
        return projectRepository.findSimilarByHobbyAndName(hobbyId, name).stream()
                .map(p -> toResponse(p, null))
                .toList();
    }
}
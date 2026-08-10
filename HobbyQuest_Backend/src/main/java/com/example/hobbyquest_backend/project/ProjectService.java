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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final int COOLDOWN_MINUTES = 10;
    private static final int DAILY_XP_CAP_PER_PROJECT = 60;

    private final ProjectRepository projectRepository;
    private final ProjectUnitRepository projectUnitRepository;
    private final UserProjectProgressRepository progressRepository;
    private final HobbyRepository hobbyRepository;
    private final SessionLogRepository sessionLogRepository;
    private final XPService xpService;
    private final StreakService streakService;
    private final UserRepository userRepository;

    private static final int MAX_ACTIVE_PROJECTS = 2;
    private static final int UNIT_COMPLETION_XP = 50;
    private static final int PROJECT_COMPLETION_BONUS = 100;

    /**
     * Lists public and user-created project templates for a passion hobby and annotates each
     * template with the current user's enrolment state.
     */
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

    /**
     * Enrols a user into a project template. The operation is idempotent so repeated taps return
     * the existing progress row instead of failing.
     */
    @Transactional
    public Long enrolInProject(Long projectId, Long userId) {
        var existing = progressRepository.findByUserIdAndProjectId(userId, projectId);

        if (existing.isPresent()) {
            UserProjectProgress progress = existing.get();

            if ("ACTIVE".equals(progress.getStatus())) {
                // Already actively enrolled — idempotent no-op
                return progress.getId();
            }

            // Previously abandoned (or otherwise inactive) — reactivating counts
            // against the cap exactly like a fresh enrolment would.
            int active = progressRepository.countByUserIdAndStatus(userId, "ACTIVE");
            if (active >= MAX_ACTIVE_PROJECTS) {
                throw new RuntimeException("You already have 2 active projects. Complete or abandon one before starting another.");
            }

            progress.setStatus("ACTIVE");
            progress.setStartedAt(java.time.LocalDateTime.now()); // fresh deadline window if the project is timed
            progressRepository.save(progress);
            return progress.getId();
        }

        int active = progressRepository.countByUserIdAndStatus(userId, "ACTIVE");
        if (active >= MAX_ACTIVE_PROJECTS) {
            throw new RuntimeException("You already have 2 active projects. Complete or abandon one before starting another.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        UserProjectProgress progress = UserProjectProgress.builder()
                .userId(userId)
                .projectId(project.getId())
                .hobbyId(project.getHobbyId())
                .currentCount(0)
                .isComplete(false)
                .startedAt(java.time.LocalDateTime.now())
                .status("ACTIVE")
                .build();
        return progressRepository.save(progress).getId();
    }

    /**
     * Creates a custom project template after surfacing duplicate suggestions. When forceCreate is
     * true, the template is saved, optional unit rows are generated, and the creator is enrolled.
     */
    @Transactional
    public CustomProjectResponse createCustomProject(CustomProjectRequest req, Long userId) {
        validateCustomProject(req);

        // Enforce active projects cap BEFORE creating any records
        int active = progressRepository.countByUserIdAndStatus(userId, "ACTIVE");
        if (active >= MAX_ACTIVE_PROJECTS) {
            throw new RuntimeException("You already have 2 active projects. Complete or abandon one before starting another.");
        }

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

    /**
     * Loads the user's active project state, next prompt, recent sessions, and cooldown countdown.
     */
    public ActiveProjectResponse getActiveProject(Long progressId, Long userId) {
        UserProjectProgress progress = progressRepository.findByIdAndUserId(progressId, userId)
                .orElseThrow(() -> new RuntimeException("Project progress not found"));
        Project project = projectRepository.findById(progress.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        String prompt = projectUnitRepository
                .findByProjectIdAndUnitNumber(project.getId(), progress.getCurrentCount() + 1)
                .map(unit -> unit.getCreativePrompt() != null && !unit.getCreativePrompt().isBlank()
                        ? unit.getCreativePrompt()
                        : unit.getName())
                .orElse(null);

        // NEW — the prompt one further ahead, only if it exists within target count
        String nextPrompt = null;
        if (progress.getCurrentCount() + 2 <= project.getTargetCount()) {
            nextPrompt = projectUnitRepository
                    .findByProjectIdAndUnitNumber(project.getId(), progress.getCurrentCount() + 2)
                    .map(unit -> unit.getCreativePrompt() != null && !unit.getCreativePrompt().isBlank()
                            ? unit.getCreativePrompt()
                            : unit.getName())
                    .orElse(null);
        }

        Boolean isOverdue = null;
        if (project.getDurationDays() != null && progress.getStartedAt() != null) {
            java.time.LocalDateTime deadline = progress.getStartedAt().plusDays(project.getDurationDays());
            isOverdue = java.time.LocalDateTime.now().isAfter(deadline);
        }

        int sessionsLogged = sessionLogRepository.countByUserIdAndProjectId(userId, project.getId());
        int vibeXpSum = sessionLogRepository.sumXpEarnedByUserIdAndProjectId(userId, project.getId());
        int unitXpSum = progress.getCurrentCount() * UNIT_COMPLETION_XP;
        int completionBonusSum = Boolean.TRUE.equals(progress.getIsComplete()) ? PROJECT_COMPLETION_BONUS : 0;
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

    /**
     * Logs a passion project session using the same XP, daily bonus, cooldown, and streak rules as
     * structured skill sessions.
     */
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

        LocalDateTime startOfDay = LocalDate.now().atTime(LocalTime.MIDNIGHT);
        int sessionXp = "NAILED_IT".equals(vibe) ? 20 : 15;
        boolean isFirstSessionToday = !sessionLogRepository.hasSessionTodayAnySkill(userId, startOfDay);
        int dailyBonus = isFirstSessionToday ? 30 : 0;
        int vibeTotal = sessionXp + dailyBonus;
        int earnedToday = sessionLogRepository.sumXpEarnedTodayForProject(userId, project.getId(), startOfDay);
        if (earnedToday >= DAILY_XP_CAP_PER_PROJECT || earnedToday + vibeTotal > DAILY_XP_CAP_PER_PROJECT) {
            // cap only applies to vibe + daily bonus
            sessionXp = 0;
            dailyBonus = 0;
            vibeTotal = 0;
        }

        // 1. Save session log (vibe + daily only)
        sessionLogRepository.save(SessionLog.builder()
                .userId(userId)
                .projectId(project.getId())
                .vibe(vibe)
                .note(note)
                .xpEarned(vibeTotal)
                .build());

        // 2. Award vibe/daily XP (subject to daily cap)
        XPResult vibeResult = xpService.addXP(user, vibeTotal);

        // 3. Streak update
        StreakResult streak = streakService.updateStreak(user);
        int streakBonus = 0;
        if (streak.getStreakBonusXp() > 0) {
            XPResult streakRes = xpService.addXP(user, streak.getStreakBonusXp());
            streakBonus = streakRes.getXpEarned();
            // use streakRes for leveledUp/newTotal if needed later
        }

// 4. Apply unit progress — capped at 2 per session (design rule: never mark
// more units done than the number of prompts currently visible to the user),
// and never above what's actually remaining in the project.
        int requestedUnits = completedUnits == null ? 0 : Math.max(0, completedUnits);
        int remaining = project.getTargetCount() - progress.getCurrentCount();
        int maxAllowedThisSession = Math.min(2, Math.max(0, remaining));
        int appliedUnits = Math.min(requestedUnits, maxAllowedThisSession);
        progress.setCurrentCount(progress.getCurrentCount() + appliedUnits);

        // 5. Unit completion XP — never subject to daily cap
        int unitXp = appliedUnits * UNIT_COMPLETION_XP;
        if (unitXp > 0) {
            xpService.addXP(user, unitXp);
        }

        // 6. Project completion check
        boolean justCompleted = false;
        int completionBonus = 0;
        if (!Boolean.TRUE.equals(progress.getIsComplete()) && progress.getCurrentCount() >= project.getTargetCount()) {
            progress.setIsComplete(true);
            progress.setStatus("COMPLETED");
            justCompleted = true;
            completionBonus = PROJECT_COMPLETION_BONUS;
            xpService.addXP(user, completionBonus);
        }

        progressRepository.save(progress);

        // 7. Build response — compute total XP earned this session
        int totalXpThisSession = vibeTotal + unitXp + completionBonus + streak.getStreakBonusXp();
        // after a series of addXP calls, read user's current xp/level
        User fresh = userRepository.findById(userId).orElse(user);

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
                .build();
    }

    /**
     * Marks one project unit complete, awards unit XP, and adds a completion bonus when the target
     * count is reached.
     */
    @Transactional
    public UnitCompleteResponse completeUnit(Long progressId, Long userId) {
        // Deprecated in Sprint 4 — keep implementation for compatibility but not used by clients.
        UserProjectProgress progress = progressRepository.findByIdAndUserId(progressId, userId)
                .orElseThrow(() -> new RuntimeException("Project progress not found"));
        Project project = projectRepository.findById(progress.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(progress.getIsComplete())) {
            return buildCompleteResponse(progress, project, user, 0, false);
        }

        progress.setCurrentCount(Math.min(project.getTargetCount(), progress.getCurrentCount() + 1));
        int xp = 50;
        boolean justCompleted = progress.getCurrentCount().equals(project.getTargetCount());
        if (justCompleted) {
            progress.setIsComplete(true);
            progress.setStatus("COMPLETED");
            xp += 100;
        }
        progressRepository.save(progress);
        XPResult result = xpService.addXP(user, xp);

        return UnitCompleteResponse.builder()
                .newCount(progress.getCurrentCount())
                .isComplete(progress.getIsComplete())
                .xpEarned(xp)
                .totalXp(result.getNewTotalXp())
                .projectJustCompleted(justCompleted)
                .totalSkills(project.getTargetCount())
                .daysTaken(1)
                .build();
    }

    private ProjectResponse toResponse(Project project, UserProjectProgress progress) {
        boolean activelyEnrolled = progress != null && "ACTIVE".equals(progress.getStatus());
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
                .status(progress != null ? progress.getStatus() : null)
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
        if (req.getUnitLabel() == null || req.getUnitLabel().isBlank()) throw new RuntimeException("Unit label is required");
    }

    private UnitCompleteResponse buildCompleteResponse(UserProjectProgress progress, Project project, User user, int xp, boolean justCompleted) {
        return UnitCompleteResponse.builder()
                .newCount(progress.getCurrentCount())
                .isComplete(progress.getIsComplete())
                .xpEarned(xp)
                .totalXp(user.getXp())
                .projectJustCompleted(justCompleted)
                .totalSkills(project.getTargetCount())
                .daysTaken(1)
                .build();
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

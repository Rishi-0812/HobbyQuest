package com.example.hobbyquest_backend.user;

import com.example.hobbyquest_backend.hobby.HobbyRepository;
import com.example.hobbyquest_backend.hobby.UserHobbyEnrolmentRepository;
import com.example.hobbyquest_backend.session.ActivityLog;
import com.example.hobbyquest_backend.session.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final ActivityLogRepository activityLogRepository;
    private final UserHobbyEnrolmentRepository enrolmentRepository;
    private final HobbyRepository hobbyRepository;

    private static final int[] LEVEL_XP = {0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200};

    @GetMapping("/user/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User currentUser) {
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(83);

        Map<LocalDate, Integer> activityByDate = activityLogRepository
                .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(currentUser.getId(), from, today)
                .stream()
                .collect(Collectors.toMap(ActivityLog::getActivityDate, ActivityLog::getSessionCount));

        List<Map<String, Object>> heatmapData = from.datesUntil(today.plusDays(1))
                .map(date -> {
                    Map<String, Object> cell = new HashMap<>();
                    cell.put("date", date.toString());
                    cell.put("count", activityByDate.getOrDefault(date, 0));
                    return cell;
                })
                .toList();

        Map<String, Object> user = new HashMap<>();
        user.put("name", currentUser.getName());
        user.put("xp", currentUser.getXp());
        user.put("level", currentUser.getLevel());

        int levelIndex = Math.max(0, Math.min(currentUser.getLevel() - 1, LEVEL_XP.length - 1));
        int currentLevelXp = LEVEL_XP[levelIndex];
        int nextLevelXp = LEVEL_XP[Math.min(levelIndex + 1, LEVEL_XP.length - 1)];
        int xpRange = Math.max(1, nextLevelXp - currentLevelXp);

        Map<String, Object> levelProgress = new HashMap<>();
        levelProgress.put("progress", Math.max(0, Math.min(1, (currentUser.getXp() - currentLevelXp) / (double) xpRange)));
        levelProgress.put("xpToNext", Math.max(0, nextLevelXp - currentUser.getXp()));
        levelProgress.put("currentLevelXp", currentLevelXp);
        levelProgress.put("nextLevelXp", nextLevelXp);

        List<Map<String, Object>> activeHobbies = enrolmentRepository.findByUserId(currentUser.getId()).stream()
                .map(enrolment -> enrolment.getHobby())
                .map(hobby -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", hobby.getId());
                    item.put("name", hobby.getName());
                    item.put("type", hobby.getType());
                    item.put("progress", 0);
                    return item;
                })
                .toList();

        Map<String, Object> streak = new HashMap<>();
        streak.put("current", currentUser.getCurrentStreak());
        streak.put("longest", currentUser.getLongestStreak());
        streak.put("freezeHeld", Boolean.TRUE.equals(currentUser.getStreakFreezeAvailable()));

        Map<String, Object> body = new HashMap<>();
        body.put("user", user);
        body.put("levelProgress", levelProgress);
        body.put("activeHobbies", activeHobbies);
        body.put("streakDetails", streak);
        body.put("streak", currentUser.getCurrentStreak());
        body.put("longestStreak", currentUser.getLongestStreak());
        body.put("freezeAvailable", Boolean.TRUE.equals(currentUser.getStreakFreezeAvailable()));
        body.put("heatmapData", heatmapData);
        body.put("heatmap", heatmapData);
        body.put("communityHighlights", List.of());

        return ResponseEntity.ok(body);
    }
}

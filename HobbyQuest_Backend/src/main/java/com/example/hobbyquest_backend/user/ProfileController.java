package com.example.hobbyquest_backend.user;

import com.example.hobbyquest_backend.hobby.HobbyResponse;
import com.example.hobbyquest_backend.hobby.HobbyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final HobbyService hobbyService;

    @GetMapping("/user/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal User currentUser) {
        List<HobbyResponse> enrolled = hobbyService.getEnrolledHobbies(currentUser.getId());
        Map<String, Object> body = new HashMap<>();
        body.put("name", currentUser.getName());
        body.put("email", currentUser.getEmail());
        body.put("xp", currentUser.getXp());
        body.put("level", currentUser.getLevel());
        body.put("currentStreak", currentUser.getCurrentStreak());
        body.put("longestStreak", currentUser.getLongestStreak());
        body.put("freezeAvailable", Boolean.TRUE.equals(currentUser.getStreakFreezeAvailable()));
        body.put("enrolledHobbies", enrolled);
        return ResponseEntity.ok(body);
    }
}

package com.example.hobbyquest_backend.user;

import com.example.hobbyquest_backend.hobby.HobbyResponse;
import com.example.hobbyquest_backend.hobby.HobbyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final HobbyService hobbyService;
    private final UserRepository userRepository;

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

    @PatchMapping("/user/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User currentUser,
                                           @RequestBody UpdateProfileRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name cannot be empty."));
        }

        String trimmedName = request.getName().trim();
        if (trimmedName.length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name must be 100 characters or fewer."));
        }

        currentUser.setName(trimmedName);
        userRepository.save(currentUser);
        return ResponseEntity.ok(Map.of("message", "Profile updated.", "name", currentUser.getName()));
    }

    @DeleteMapping("/user/profile")
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal User currentUser) {
        currentUser.setIsDeleted(true);
        currentUser.setDeletedAt(LocalDateTime.now());
        userRepository.save(currentUser);
        return ResponseEntity.ok(Map.of("message", "Account deleted."));
    }
}
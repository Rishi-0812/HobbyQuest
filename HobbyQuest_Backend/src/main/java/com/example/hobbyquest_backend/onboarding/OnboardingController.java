package com.example.hobbyquest_backend.onboarding;

import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserPreferences;
import com.example.hobbyquest_backend.user.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class OnboardingController {

    private final UserPreferencesRepository preferencesRepository;

    @PostMapping("/onboarding")
    public ResponseEntity<?> saveOnboarding(
            @AuthenticationPrincipal User currentUser,
            @RequestBody OnboardingRequest request
    ) {
        UserPreferences prefs = preferencesRepository
                .findByUserId(currentUser.getId())
                .orElse(new UserPreferences());

        prefs.setUser(currentUser);
        prefs.setHobbyTypePreference(request.getHobbyTypePreference());
        prefs.setBudgetRange(request.getBudgetRange());
        prefs.setLocationPreference(request.getLocationPreference());
        prefs.setInterestTags(request.getInterestTags());

        // ── New fields from updated questionnaire ──────────────────────────
        // These are stored but UserPreferences entity needs them added too
        // (see UserPreferences fix below)

        preferencesRepository.save(prefs);

        return ResponseEntity.ok(Map.of(
                "message", "Preferences saved successfully",
                "onboardingComplete", true
        ));
    }

    @GetMapping("/onboarding/status")
    public ResponseEntity<?> getOnboardingStatus(
            @AuthenticationPrincipal User currentUser
    ) {
        boolean complete = preferencesRepository.existsByUserId(currentUser.getId());
        return ResponseEntity.ok(Map.of("onboardingComplete", complete));
    }
}
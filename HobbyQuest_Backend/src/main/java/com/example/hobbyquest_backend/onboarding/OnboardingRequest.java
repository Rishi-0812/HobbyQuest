// src/main/java/com/example/hobbyquest_backend/onboarding/OnboardingRequest.java
package com.example.hobbyquest_backend.onboarding;

import lombok.Data;

@Data
public class OnboardingRequest {

    // Step 1
    private String   locationPreference;   // "indoor", "social", "venue", "outdoor"
    private String   energyLevel;          // "calm", "light", "moderate", "intense"

    // Step 2
    private String   motivation;           // "build", "understand", "create", "compete", "master"

    // Step 3
    private String   budgetRange;          // "free", "low", "medium"

    // Step 4
    private String   depthPreference;      // "fun", "good", "master"
    private String   mentalLoad;           // "switch_off", "light_focus", "deep_thinking"

    // Step 5 — already-expanded flat tags (expanded on frontend from category selection)
    // e.g. ["creative", "art", "drawing", "writing", "poetry", "storytelling"]
    private String[] interestTags;

    // Derived from motivation on frontend before sending
    private String   hobbyTypePreference;  // "structured", "passion", "both"
}
 
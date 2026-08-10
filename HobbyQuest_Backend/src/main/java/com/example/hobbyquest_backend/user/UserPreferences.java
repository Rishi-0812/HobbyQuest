package com.example.hobbyquest_backend.user;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Step 1
    @Column(name = "location_preference", length = 20)
    private String locationPreference;   // "indoor", "social", "venue", "outdoor"

    @Column(name = "energy_level", length = 20)
    private String energyLevel;          // "calm", "light", "moderate", "intense"

    // Step 2
    @Column(name = "motivation", length = 20)
    private String motivation;           // "build", "understand", "create", "compete", "master"

    // Step 3
    @Column(name = "budget_range", length = 20)
    private String budgetRange;          // "free", "low", "medium"

    // Step 4
    @Column(name = "depth_preference", length = 20)
    private String depthPreference;      // "fun", "good", "master"

    @Column(name = "mental_load", length = 30)
    private String mentalLoad;           // "switch_off", "light_focus", "deep_thinking"

    // Derived from motivation — used by recommendation engine
    @Column(name = "hobby_type_preference", length = 20)
    private String hobbyTypePreference;  // "structured", "passion", "both"

    // Step 5 — expanded flat tags from category selection
    @Column(name = "interest_tags", columnDefinition = "TEXT[]")
    @org.hibernate.annotations.Array(length = 30)
    private String[] interestTags;
}
package com.example.hobbyquest_backend.hobby;

import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserPreferences;
import com.example.hobbyquest_backend.user.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HobbyService {

    private final HobbyRepository              hobbyRepository;
    private final UserHobbyEnrolmentRepository enrolmentRepository;
    private final UserPreferencesRepository    preferencesRepository;

    // Convert entity to response DTO
    private HobbyResponse toResponse(Hobby hobby, Long userId) {
        // "enrolled" must mean actively enrolled, not "has any row (even unenrolled)"
        boolean enrolled = enrolmentRepository.existsByUserIdAndHobbyIdAndStatus(userId, hobby.getId(), "ACTIVE");
        return HobbyResponse.builder()
                .id(hobby.getId())
                .name(hobby.getName())
                .type(hobby.getType())
                .description(hobby.getDescription())
                .tags(hobby.getTags())
                .difficulty(hobby.getDifficulty())
                .emoji(hobby.getEmoji())
                .enrolled(enrolled)
                .build();
    }

    // GET /hobbies — all active hobbies, optional type filter
    public List<HobbyResponse> getAllHobbies(String type, Long userId) {
        List<Hobby> hobbies = (type != null && !type.isBlank())
                ? hobbyRepository.findByTypeAndIsActiveTrue(type)
                : hobbyRepository.findByIsActiveTrue();

        return hobbies.stream()
                .map(h -> toResponse(h, userId))
                .collect(Collectors.toList());
    }

    // GET /hobbies/recommendations
    public RecommendationResponse getRecommendations(Long userId) {
        UserPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Please complete onboarding first"));

        String[] userTags = buildUserTags(prefs);

        if (userTags.length == 0) {
            List<Hobby> fallback = hobbyRepository.findByIsActiveTrue();

            List<HobbyResponse> all = fallback.stream()
                    .map(h -> toResponse(h, userId))
                    .collect(Collectors.toList());

            return RecommendationResponse.builder()
                    .structured(all)
                    .passion(List.of())
                    .build();
        }
        List<HobbyResponse> structured;
        List<HobbyResponse> passion;

        String typePreference = prefs.getHobbyTypePreference();

        if ("structured".equals(typePreference)) {
            structured = hobbyRepository.findRecommendationsByType(userTags, "structured")
                    .stream().map(h -> toResponse(h, userId)).collect(Collectors.toList());
            passion = List.of();
        } else if ("passion".equals(typePreference)) {
            structured = List.of();
            passion = hobbyRepository.findRecommendationsByType(userTags, "passion")
                    .stream().map(h -> toResponse(h, userId)).collect(Collectors.toList());
        } else {
            structured = hobbyRepository.findRecommendationsByType(userTags, "structured")
                    .stream().map(h -> toResponse(h, userId)).collect(Collectors.toList());
            passion = hobbyRepository.findRecommendationsByType(userTags, "passion")
                    .stream().map(h -> toResponse(h, userId)).collect(Collectors.toList());
        }

        return RecommendationResponse.builder()
                .structured(structured)
                .passion(passion)
                .build();
    }

    private String[] buildUserTags(UserPreferences prefs) {
        String[] interestTags = prefs.getInterestTags() != null
                ? prefs.getInterestTags()
                : new String[]{};

        String budgetTag = prefs.getBudgetRange()        != null ? prefs.getBudgetRange()        : "";
        String locTag    = prefs.getLocationPreference() != null ? prefs.getLocationPreference() : "";

        return Arrays.stream(
                        new String[][]{interestTags, {budgetTag, locTag}}
                )
                .flatMap(Arrays::stream)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .toArray(String[]::new);
    }

    // POST /hobbies/{hobbyId}/enrol
    public void enrolUser(Long userId, Long hobbyId, User user) {
        Hobby hobby = hobbyRepository.findById(hobbyId)
                .orElseThrow(() -> new RuntimeException("Hobby not found"));

        // The unique (user_id, hobby_id) constraint means we can never insert
        // a second row for this pairing — so a previous unenrolment has to be
        // reactivated instead of a fresh row being created.
        var existing = enrolmentRepository.findByUserIdAndHobbyId(userId, hobbyId);

        if (existing.isPresent()) {
            UserHobbyEnrolment enrolment = existing.get();
            if ("ACTIVE".equals(enrolment.getStatus())) {
                throw new RuntimeException("Already enrolled in this hobby");
            }
            // Re-enrolling after a previous unenrol — check the cap same as a fresh enrol
            checkEnrollmentCap(userId, hobby);
            enrolment.setStatus("ACTIVE");
            enrolment.setEnrolledAt(java.time.LocalDateTime.now());
            enrolmentRepository.save(enrolment);
            return;
        }

        checkEnrollmentCap(userId, hobby);

        UserHobbyEnrolment enrolment = UserHobbyEnrolment.builder()
                .user(user)
                .hobby(hobby)
                .status("ACTIVE")
                .build();

        enrolmentRepository.save(enrolment);
    }

    private void checkEnrollmentCap(Long userId, Hobby hobby) {
        long enrolledCount = enrolmentRepository.countByUserIdAndHobbyTypeAndStatus(userId, hobby.getType(), "ACTIVE");
        int maxEnrolled = "structured".equalsIgnoreCase(hobby.getType()) ? 2 : 3;

        if (enrolledCount >= maxEnrolled) {
            String message = "structured".equalsIgnoreCase(hobby.getType())
                    ? "You can enrol in a maximum of 2 structured hobbies. Unenrol from one before starting another."
                    : "You can enrol in a maximum of 3 passion hobbies. Unenrol from one before starting another.";
            throw new RuntimeException(message);
        }
    }

    // PATCH /hobbies/{hobbyId}/unenrol
    public void unenrolUser(Long userId, Long hobbyId) {
        UserHobbyEnrolment enrolment = enrolmentRepository.findByUserIdAndHobbyId(userId, hobbyId)
                .orElseThrow(() -> new RuntimeException("You are not enrolled in this hobby"));

        if (!"ACTIVE".equals(enrolment.getStatus())) {
            throw new RuntimeException("You are not currently enrolled in this hobby");
        }

        enrolment.setStatus("UNENROLLED");
        enrolmentRepository.save(enrolment);
        // Deliberately does NOT touch user_skill_progress or user_project_progress —
        // history is preserved in case the user re-enrols later.
    }

    // GET enrolled hobbies for a user — active only
    public List<HobbyResponse> getEnrolledHobbies(Long userId) {
        return enrolmentRepository.findByUserIdAndStatus(userId, "ACTIVE").stream()
                .map(e -> toResponse(e.getHobby(), userId))
                .collect(Collectors.toList());
    }
}
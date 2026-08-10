package com.example.hobbyquest_backend.hobby;

import com.example.hobbyquest_backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/hobbies")
@RequiredArgsConstructor
public class HobbyController {

    private final HobbyService hobbyService;

    // GET /hobbies
    // Optional query param: ?type=structured or ?type=passion
    // Returns all active hobbies with enrolled flag per user
    @GetMapping
    public ResponseEntity<?> getAllHobbies(
            @RequestParam(required = false) String type,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(hobbyService.getAllHobbies(type, currentUser.getId()));
    }

    // GET /hobbies/recommendations
    // Uses user_preferences to run tag-matching query
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            return ResponseEntity.ok(hobbyService.getRecommendations(currentUser.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET /hobbies/enrolled
    // Returns hobbies the current user is enrolled in (used by dashboard)
    @GetMapping("/enrolled")
    public ResponseEntity<?> getEnrolled(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(hobbyService.getEnrolledHobbies(currentUser.getId()));
    }

    // POST /hobbies/{hobbyId}/enrol
    // Enrols the current user in a hobby
    @PostMapping("/{hobbyId}/enrol")
    public ResponseEntity<?> enrol(
            @PathVariable Long hobbyId,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            hobbyService.enrolUser(currentUser.getId(), hobbyId, currentUser);
            return ResponseEntity.ok(Map.of("message", "Enrolled successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // add this method alongside the existing enrol() method
    @PatchMapping("/{hobbyId}/unenrol")
    public ResponseEntity<?> unenrol(
            @PathVariable Long hobbyId,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            hobbyService.unenrolUser(currentUser.getId(), hobbyId);
            return ResponseEntity.ok(Map.of("message", "Unenrolled successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
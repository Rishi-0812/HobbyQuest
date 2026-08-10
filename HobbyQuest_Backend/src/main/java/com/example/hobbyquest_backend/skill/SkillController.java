package com.example.hobbyquest_backend.skill;

import com.example.hobbyquest_backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    // GET /hobbies/{hobbyId}/roadmap
    @GetMapping("/hobbies/{hobbyId}/roadmap")
    public ResponseEntity<?> getRoadmap(
            @PathVariable Long hobbyId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(skillService.getRoadmap(hobbyId, currentUser.getId()));
    }

    // GET /skills/{skillId}/detail
    @GetMapping("/skills/{skillId}/detail")
    public ResponseEntity<?> getSkillDetail(
            @PathVariable Long skillId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(skillService.getSkillDetail(skillId, currentUser.getId()));
    }

    // POST /user/skills/{skillId}/log
    @PostMapping("/user/skills/{skillId}/log")
    public ResponseEntity<?> logSession(
            @PathVariable Long skillId,
            @AuthenticationPrincipal User currentUser,
            @RequestBody SessionLogRequest request
    ) {
        try {
            SessionLogResponse result = skillService.logSession(
                    skillId,
                    currentUser.getId(),
                    currentUser,
                    request.getVibe(),
                    request.getNote()
            );
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // PATCH /user/skills/{skillId}/status
    // Moves LEARNING → ALMOST_THERE (user-initiated)
    @PatchMapping("/user/skills/{skillId}/status")
    public ResponseEntity<?> upgradeStatus(
            @PathVariable Long skillId,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            return ResponseEntity.ok(skillService.upgradeStatus(skillId, currentUser.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
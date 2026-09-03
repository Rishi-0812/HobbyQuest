package com.example.hobbyquest_backend.project;

import com.example.hobbyquest_backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/hobbies/{hobbyId}/projects")
    public ResponseEntity<?> getProjects(@PathVariable Long hobbyId, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.getProjectsForHobby(hobbyId, currentUser.getId()));
    }

    @PostMapping("/user/projects/enrol/{projectId}")
    public ResponseEntity<?> enrol(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser) {
        Long progressId = projectService.enrolInProject(projectId, currentUser.getId());
        return ResponseEntity.ok(Map.of("progressId", progressId));
    }

    @PostMapping("/projects")
    public ResponseEntity<?> create(@RequestBody CustomProjectRequest request, @AuthenticationPrincipal User currentUser) {
        try {
            return ResponseEntity.ok(projectService.createCustomProject(request, currentUser.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/projects/{progressId}/active")
    public ResponseEntity<?> active(@PathVariable Long progressId, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.getActiveProject(progressId, currentUser.getId()));
    }

    @PostMapping("/user/projects/{progressId}/log")
    public ResponseEntity<?> log(@PathVariable Long progressId, @RequestBody ProjectSessionRequest request, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.logSession(progressId, request.getVibe(), request.getNote(), request.getCompletedUnits(), currentUser.getId()));
    }

    // Marking individual units complete was removed in Sprint 4 (unified log session).
    // Keep the service method for compatibility, but remove the public route so clients stop calling it.

    @PatchMapping("/user/projects/{progressId}/abandon")
    public ResponseEntity<?> abandon(@PathVariable Long progressId, @AuthenticationPrincipal User currentUser) {
        projectService.abandonProject(progressId, currentUser.getId());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/projects/check-duplicate")
    public ResponseEntity<?> checkDuplicate(@RequestParam String name, @RequestParam Long hobbyId) {
        return ResponseEntity.ok(projectService.findSimilarProjects(hobbyId, name));
    }
}

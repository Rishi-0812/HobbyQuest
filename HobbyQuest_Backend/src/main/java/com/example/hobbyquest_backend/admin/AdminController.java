package com.example.hobbyquest_backend.admin;

import com.example.hobbyquest_backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> suggestions() {
        return ResponseEntity.ok(adminService.getSuggestions());
    }

    @PatchMapping("/suggestions/{id}/reviewed")
    public ResponseEntity<?> markSuggestionReviewed(@PathVariable Long id) {
        try {
            adminService.markSuggestionReviewed(id);
            return ResponseEntity.ok(Map.of("message", "Suggestion marked as reviewed."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/hobbies/generate")
    public ResponseEntity<?> generateRoadmap(@RequestBody GenerateRoadmapRequest req) {
        try {
            return ResponseEntity.ok(adminService.generateRoadmap(req));
        } catch (GeminiGenerationException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/projects/generate")
    public ResponseEntity<?> generateProject(@RequestBody GenerateProjectRequest req) {
        try {
            return ResponseEntity.ok(adminService.generateProject(req));
        } catch (GeminiGenerationException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/content/pending")
    public ResponseEntity<?> pendingContent(@RequestParam(required = false) String contentType) {
        return ResponseEntity.ok(adminService.getPendingContent(contentType));
    }

    @GetMapping("/content/{id}")
    public ResponseEntity<?> contentById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminService.getContentById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/content/{id}/draft")
    public ResponseEntity<?> updateDraft(@PathVariable Long id, @RequestBody ApproveContentRequest req) {
        try {
            return ResponseEntity.ok(adminService.updateEditedContent(id, req.getEditedJson()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/content/{id}/approve")
    public ResponseEntity<?> approveContent(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveContentRequest req,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            Long publishedId = adminService.approveContent(
                    id,
                    currentUser.getId(),
                    req != null ? req.getEditedJson() : null
            );
            return ResponseEntity.ok(Map.of("publishedId", publishedId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/content/{id}/discard")
    public ResponseEntity<?> discardContent(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        try {
            adminService.discardContent(id, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Content discarded."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/posts/pending")
    public ResponseEntity<?> pendingPosts() {
        return ResponseEntity.ok(adminService.getPendingPosts());
    }

    @PatchMapping("/posts/{id}/approve")
    public ResponseEntity<?> approvePost(@PathVariable Long id) {
        try {
            adminService.approvePost(id);
            return ResponseEntity.ok(Map.of("message", "Post approved."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/posts/{id}/reject")
    public ResponseEntity<?> rejectPost(@PathVariable Long id) {
        try {
            adminService.rejectPost(id);
            return ResponseEntity.ok(Map.of("message", "Post rejected."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }
}

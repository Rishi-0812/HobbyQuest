package com.example.hobbyquest_backend.passion;

import com.example.hobbyquest_backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PassionProjectController {

    private final PassionProjectService service;

    @GetMapping("/passion/hobbies/{hobbyId}/home")
    public ResponseEntity<?> getHome(@PathVariable Long hobbyId, @AuthenticationPrincipal User currentUser) {
        try {
            return ResponseEntity.ok(service.getHome(currentUser.getId(), hobbyId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/passion/hobbies/{hobbyId}/projects")
    public ResponseEntity<?> createProject(@PathVariable Long hobbyId, @AuthenticationPrincipal User currentUser, @RequestBody ProjectRequest request) {
        try {
            return ResponseEntity.ok(service.createProject(currentUser.getId(), hobbyId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/passion/projects/{projectId}/complete")
    public ResponseEntity<?> completeProject(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser) {
        try {
            return ResponseEntity.ok(service.completeProject(currentUser.getId(), projectId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

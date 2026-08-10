package com.example.hobbyquest_backend.community;

import com.example.hobbyquest_backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityPostRepository postRepository;

    @GetMapping("/community/posts")
    public ResponseEntity<?> approved(@RequestParam(name = "hobby_id", required = false) Long hobbyId) {
        if (hobbyId == null) {
            return ResponseEntity.ok(postRepository.findByIsApprovedTrueOrderByCreatedAtDesc());
        }
        return ResponseEntity.ok(postRepository.findByIsApprovedTrueAndHobbyIdOrderByCreatedAtDesc(hobbyId));
    }

    @PostMapping("/community/posts")
    public ResponseEntity<?> create(@RequestBody CommunityPostRequest request, @AuthenticationPrincipal User currentUser) {
        CommunityPost saved = postRepository.save(CommunityPost.builder()
                .userId(currentUser.getId())
                .hobbyId(request.getHobbyId())
                .postType(request.getPostType() == null ? "project_completion" : request.getPostType())
                .caption(request.getCaption())
                .imageUrl(request.getImageUrl())
                .isApproved(false)
                .build());
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Post submitted for approval"));
    }
}

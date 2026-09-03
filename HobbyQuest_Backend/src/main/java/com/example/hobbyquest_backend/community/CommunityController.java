package com.example.hobbyquest_backend.community;

import com.example.hobbyquest_backend.hobby.Hobby;
import com.example.hobbyquest_backend.hobby.HobbyRepository;
import com.example.hobbyquest_backend.user.User;
import com.example.hobbyquest_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityPostRepository postRepository;
    private final UserRepository userRepository;
    private final HobbyRepository hobbyRepository;

    @GetMapping("/community/posts")
    public ResponseEntity<?> approved(
            @RequestParam(name = "hobby_id", required = false) Long hobbyId,
            @RequestParam(name = "project_id", required = false) Long projectId,
            @AuthenticationPrincipal User currentUser) {
        List<CommunityPost> posts;
        if (projectId != null && currentUser != null) {
            posts = postRepository.findByProjectIdAndUserId(projectId, currentUser.getId()).map(List::of).orElse(List.of());
        } else if (projectId != null) {
            posts = postRepository.findByIsApprovedTrueAndProjectIdOrderByCreatedAtDesc(projectId);
        } else if (hobbyId == null) {
            posts = postRepository.findByIsApprovedTrueOrderByCreatedAtDesc();
        } else {
            posts = postRepository.findByIsApprovedTrueAndHobbyIdOrderByCreatedAtDesc(hobbyId);
        }

        List<CommunityPostResponse> response = posts.stream().map(post -> {
            String name = userRepository.findById(post.getUserId()).map(User::getName).orElse("A HobbyQuest user");
            String hobbyName = post.getHobbyId() != null
                    ? hobbyRepository.findById(post.getHobbyId()).map(Hobby::getName).orElse(null)
                    : null;
            return CommunityPostResponse.builder()
                    .id(post.getId())
                    .posterName(name)
                    .hobbyId(post.getHobbyId())
                    .hobbyName(hobbyName)
                    .projectId(post.getProjectId())
                    .postType(post.getPostType())
                    .caption(post.getCaption())
                    .imageUrl(post.getImageUrl())
                    .postText(post.getPostText())
                    .createdAt(post.getCreatedAt())
                    .build();
        }).toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/community/posts")
    public ResponseEntity<?> create(@RequestBody CommunityPostRequest request, @AuthenticationPrincipal User currentUser) {
        String validationError = validateContent(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }

        CommunityPost saved = postRepository.save(CommunityPost.builder()
                .userId(currentUser.getId())
                .hobbyId(request.getHobbyId())
                .projectId(request.getProjectId())
                .postType(request.getPostType() == null ? "project_completion" : request.getPostType())
                .caption(request.getCaption())
                .imageUrl(request.getImageUrl())
                .postText(request.getPostText())
                .isApproved(false)
                .build());
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Post submitted for approval"));
    }

    @PatchMapping("/community/posts/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CommunityPostRequest request, @AuthenticationPrincipal User currentUser) {
        String validationError = validateContent(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }
        CommunityPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!currentUser.getId().equals(post.getUserId())) {
            throw new RuntimeException("You can only replace your own post");
        }
        post.setImageUrl(request.getImageUrl());
        post.setPostText(request.getPostText());
        if (request.getCaption() != null) post.setCaption(request.getCaption());
        if (request.getProjectId() != null) post.setProjectId(request.getProjectId());
        if (request.getHobbyId() != null) post.setHobbyId(request.getHobbyId());
        if (request.getPostType() != null) post.setPostType(request.getPostType());

        CommunityPost saved = postRepository.save(post);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Post updated"));
    }

    private String validateContent(CommunityPostRequest request) {
        if (request == null) {
            return "Request body is required.";
        }
        boolean hasImage = request.getImageUrl() != null && !request.getImageUrl().isBlank();
        boolean hasText = request.getPostText() != null && !request.getPostText().isBlank();
        if (hasImage == hasText) {
            return hasImage
                    ? "Choose either a photo or a written piece, not both."
                    : "Add a photo or write a written piece before sharing.";
        }
        return null;
    }
}

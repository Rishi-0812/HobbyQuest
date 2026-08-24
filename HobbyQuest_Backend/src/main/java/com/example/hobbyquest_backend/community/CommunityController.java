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
    public ResponseEntity<?> approved(@RequestParam(name = "hobby_id", required = false) Long hobbyId) {
        List<CommunityPost> posts = hobbyId == null
                ? postRepository.findByIsApprovedTrueOrderByCreatedAtDesc()
                : postRepository.findByIsApprovedTrueAndHobbyIdOrderByCreatedAtDesc(hobbyId);

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
                    .postType(post.getPostType())
                    .caption(post.getCaption())
                    .imageUrl(post.getImageUrl())
                    .createdAt(post.getCreatedAt())
                    .build();
        }).toList();

        return ResponseEntity.ok(response);
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

package com.example.hobbyquest_backend.community;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findByIsApprovedTrueOrderByCreatedAtDesc();
    List<CommunityPost> findByIsApprovedTrueAndHobbyIdOrderByCreatedAtDesc(Long hobbyId);
    List<CommunityPost> findByIsApprovedTrueAndProjectIdOrderByCreatedAtDesc(Long projectId);
    Optional<CommunityPost> findByProjectIdAndUserId(Long projectId, Long userId);
    List<CommunityPost> findByIsApprovedFalseOrderByCreatedAtDesc();
    long countByIsApprovedFalse();
}

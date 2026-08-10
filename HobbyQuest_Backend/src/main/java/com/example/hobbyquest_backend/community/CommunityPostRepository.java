package com.example.hobbyquest_backend.community;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findByIsApprovedTrueOrderByCreatedAtDesc();
    List<CommunityPost> findByIsApprovedTrueAndHobbyIdOrderByCreatedAtDesc(Long hobbyId);
    List<CommunityPost> findByIsApprovedFalseOrderByCreatedAtDesc();
    long countByIsApprovedFalse();
}

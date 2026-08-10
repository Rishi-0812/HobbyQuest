package com.example.hobbyquest_backend.feedback;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeedbackVoteRepository extends JpaRepository<FeedbackVote, Long> {
    boolean existsByUserIdAndFeedbackId(Long userId, Long feedbackId);
    Optional<FeedbackVote> findByUserIdAndFeedbackId(Long userId, Long feedbackId);
}
package com.example.hobbyquest_backend.feedback;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FeedbackReportRepository extends JpaRepository<FeedbackReport, Long> {
    List<FeedbackReport> findByTypeIgnoreCaseAndIsReviewedFalseOrderByVoteCountDesc(String type);
    List<FeedbackReport> findByTypeIgnoreCaseOrderByVoteCountDesc(String type);
    long countByTypeIgnoreCaseAndIsReviewedFalse(String type);
    long countByIsReviewedFalse();
    List<FeedbackReport> findAllByOrderByVoteCountDesc();

    @Modifying
    @Query("DELETE FROM FeedbackReport f WHERE f.isReviewed = true AND f.reviewedAt < :cutoff")
    void deleteReviewedBefore(@Param("cutoff") LocalDateTime cutoff);
}
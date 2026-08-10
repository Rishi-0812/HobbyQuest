package com.example.hobbyquest_backend.feedback;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class FeedbackCleanupJob {

    private static final int RETENTION_HOURS = 48;

    private final FeedbackReportRepository feedbackReportRepository;

    // Runs once an hour — reviewed feedback older than 48h is purged so the
    // admin queue doesn't accumulate stale, already-handled items forever.
    @Scheduled(fixedRate = 60 * 60 * 1000)
    @Transactional
    public void purgeOldReviewedFeedback() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(RETENTION_HOURS);
        feedbackReportRepository.deleteReviewedBefore(cutoff);
    }
}
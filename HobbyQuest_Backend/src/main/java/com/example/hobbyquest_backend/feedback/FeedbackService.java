package com.example.hobbyquest_backend.feedback;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackReportRepository feedbackReportRepository;
    private final FeedbackVoteRepository feedbackVoteRepository;

    public FeedbackReport submit(Long userId, String type, String hobbyName, String message, String imageUrl) {
        String resolvedType = (type == null || type.isBlank()) ? "other" : type.trim().toLowerCase();

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Feedback message is required");
        }

        String resolvedHobbyName = hobbyName;
        if ("suggestion".equalsIgnoreCase(resolvedType)) {
            if (hobbyName == null || hobbyName.isBlank()) {
                throw new IllegalArgumentException("Hobby name is required for a suggestion.");
            }
            String cleaned = hobbyName.trim();
            if (cleaned.length() < 2 || cleaned.length() > 60) {
                throw new IllegalArgumentException("Hobby name must be between 2 and 60 characters.");
            }
            if (!cleaned.matches("^[a-zA-Z0-9 &'\\-]+$")) {
                throw new IllegalArgumentException("Hobby name contains invalid characters.");
            }
            // Require at least one real letter, not just numbers/symbols.
            if (!cleaned.matches(".*[a-zA-Z]{2,}.*")) {
                throw new IllegalArgumentException("Please enter a real hobby name.");
            }
            resolvedHobbyName = cleaned;
        }

        return feedbackReportRepository.save(FeedbackReport.builder()
                .userId(userId)
                .type(resolvedType)
                .hobbyName(resolvedHobbyName)
                .message(message.trim())
                .imageUrl(imageUrl)
                .build());
    }

    /**
     * Unreviewed suggestions only, sorted by vote count — this is the public
     * board users browse to see (and vote on) what others have suggested.
     * Only 'suggestion' type is voteable; bugs/other don't carry a vote signal.
     */
    public List<SuggestionResponse> getSuggestionsBoard(Long userId) {
        List<FeedbackReport> suggestions = feedbackReportRepository
                .findByTypeIgnoreCaseAndIsReviewedFalseOrderByVoteCountDesc("suggestion");

        return suggestions.stream().map(item -> SuggestionResponse.builder()
                .id(item.getId())
                .hobbyName(item.getHobbyName())
                .message(item.getMessage())
                .voteCount(item.getVoteCount())
                .hasVoted(feedbackVoteRepository.existsByUserIdAndFeedbackId(userId, item.getId()))
                .createdAt(item.getCreatedAt())
                .build()
        ).toList();
    }

    /**
     * Toggle vote: if the user hasn't voted, add a vote; if they have, remove it.
     * The unique (user_id, feedback_id) constraint on feedback_votes backs this
     * up at the DB level so a double-tap race can't double-count.
     */
    @Transactional
    public SuggestionResponse toggleVote(Long userId, Long feedbackId) {
        FeedbackReport report = feedbackReportRepository.findById(feedbackId)
                .orElseThrow(() -> new NoSuchElementException("Suggestion not found."));

        if (!"suggestion".equalsIgnoreCase(report.getType())) {
            throw new IllegalArgumentException("Only suggestions can be voted on.");
        }

        boolean hasVoted = feedbackVoteRepository.existsByUserIdAndFeedbackId(userId, feedbackId);

        if (hasVoted) {
            feedbackVoteRepository.findByUserIdAndFeedbackId(userId, feedbackId)
                    .ifPresent(feedbackVoteRepository::delete);
            report.setVoteCount(Math.max(0, report.getVoteCount() - 1));
        } else {
            feedbackVoteRepository.save(FeedbackVote.builder()
                    .userId(userId)
                    .feedbackId(feedbackId)
                    .build());
            report.setVoteCount(report.getVoteCount() + 1);
        }

        FeedbackReport saved = feedbackReportRepository.save(report);

        return SuggestionResponse.builder()
                .id(saved.getId())
                .hobbyName(saved.getHobbyName())
                .message(saved.getMessage())
                .voteCount(saved.getVoteCount())
                .hasVoted(!hasVoted)
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
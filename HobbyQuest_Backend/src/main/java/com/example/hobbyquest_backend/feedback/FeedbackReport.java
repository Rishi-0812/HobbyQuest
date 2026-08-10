package com.example.hobbyquest_backend.feedback;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "hobby_name", length = 150)
    private String hobbyName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "vote_count")
    @Builder.Default
    private Integer voteCount = 0;

    @Column(name = "is_reviewed")
    @Builder.Default
    private Boolean isReviewed = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;
}

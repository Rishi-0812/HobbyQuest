package com.example.hobbyquest_backend.feedback;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback_votes", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "feedback_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackVote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "feedback_id", nullable = false)
    private Long feedbackId;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
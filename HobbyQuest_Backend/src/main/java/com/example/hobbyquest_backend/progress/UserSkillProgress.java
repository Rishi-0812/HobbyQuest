package com.example.hobbyquest_backend.progress;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_skill_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "skill_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(name = "hobby_id", nullable = false)
    private Long hobbyId;

    // LEARNING | ALMOST_THERE | COMPLETED
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "LEARNING";

    // Incremented on every session log
    @Column(name = "attempt_count")
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "first_attempted_at")
    private LocalDateTime firstAttemptedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
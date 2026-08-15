package com.example.hobbyquest_backend.session;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "session_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Null for passion sessions
    @Column(name = "skill_id")
    private Long skillId;

    // Null for structured sessions
    @Column(name = "project_id")
    private Long projectId;

    // STRUGGLING | GETTING_THE_HANG_OF_IT | NAILED_IT
    @Column(nullable = false, length = 30)
    private String vibe;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "xp_earned")
    @Builder.Default
    private Integer xpEarned = 0;

    @Column(name = "logged_at")
    @Builder.Default
    private LocalDateTime loggedAt = LocalDateTime.now();

    @Column(name = "bonus_xp")
    @Builder.Default
    private Integer bonusXp = 0;

    @Column(columnDefinition = "TEXT")
    private String highlights;
}
package com.example.hobbyquest_backend.progress;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "user_project_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "project_id"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProjectProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "hobby_id", nullable = false)
    private Long hobbyId;

    @Column(name = "current_count", nullable = false)
    @Builder.Default
    private Integer currentCount = 0;

    @Column(name = "is_complete", nullable = false)
    @Builder.Default
    private Boolean isComplete = false;

    @Column(name = "started_at")
    private java.time.LocalDateTime startedAt;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE | COMPLETED | ABANDONED
}

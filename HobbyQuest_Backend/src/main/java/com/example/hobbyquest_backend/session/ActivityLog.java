package com.example.hobbyquest_backend.session;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "activity_log",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "activity_date"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    // How many sessions logged this day — used for heatmap intensity
    @Column(name = "session_count")
    @Builder.Default
    private Integer sessionCount = 1;
}
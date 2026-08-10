package com.example.hobbyquest_backend.admin;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_generated_content")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGeneratedContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType; // roadmap | project

    @Column(name = "target_hobby_id")
    private Long targetHobbyId;

    @Column(name = "hobby_name", nullable = false, length = 100)
    private String hobbyName;

    @Column(name = "hobby_type", nullable = false, length = 20)
    private String hobbyType;

    @Column(name = "raw_json", nullable = false, columnDefinition = "TEXT")
    private String rawJson;

    @Column(name = "edited_json", columnDefinition = "TEXT")
    private String editedJson;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "pending";

    @Column(name = "generated_at", nullable = false)
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(length = 20)
    private String difficulty;

    @Column(name = "project_name", length = 150)
    private String projectName;

    @Column(name = "target_count")
    private Integer targetCount;

    @Column(name = "unit_label", length = 70)
    private String unitLabel;

    @Column(name = "unit_label_plural", length = 70)
    private String unitLabelPlural;

    @Column(name = "duration_days")
    private Integer durationDays;
}

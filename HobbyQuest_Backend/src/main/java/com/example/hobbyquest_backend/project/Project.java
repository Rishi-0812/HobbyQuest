package com.example.hobbyquest_backend.project;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hobby_id", nullable = false)
    private Long hobbyId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_count", nullable = false)
    private Integer targetCount;

    @Column(name = "unit_label", nullable = false, length = 50)
    private String unitLabel;

    @Column(name = "unit_label_plural", length = 70)
    private String unitLabelPlural;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String source = "admin";

    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "duration_days")
    private Integer durationDays; // nullable: NULL = untimed
}

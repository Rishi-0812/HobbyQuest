package com.example.hobbyquest_backend.project;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Integer targetCount;
    private String unitLabel;
    private String unitLabelPlural;
    private String source;
    private Boolean isPublic;
    private Boolean isEnrolled;
    private Integer currentCount;
    private Long progressId;
    private String status; // ACTIVE | COMPLETED | ABANDONED
    private java.time.LocalDateTime startedAt;
}

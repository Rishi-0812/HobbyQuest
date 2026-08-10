package com.example.hobbyquest_backend.skill;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SkillSummaryResponse {
    private Long   skillId;
    private String name;
    private String status;      // LOCKED | AVAILABLE | LEARNING | ALMOST_THERE | COMPLETED
    private int    attemptCount;
    private int    orderIndex;
}
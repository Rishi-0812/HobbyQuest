package com.example.hobbyquest_backend.skill;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RoadmapLevelResponse {
    private String                  level;
    private List<SkillSummaryResponse> skills;
    private int                     completedCount;
    private int                     totalCount;
}
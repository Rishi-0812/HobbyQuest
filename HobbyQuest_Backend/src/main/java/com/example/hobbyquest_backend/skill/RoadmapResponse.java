package com.example.hobbyquest_backend.skill;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RoadmapResponse {
    private List<RoadmapLevelResponse> levels;
}
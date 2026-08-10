package com.example.hobbyquest_backend.passion;

import com.example.hobbyquest_backend.hobby.HobbyResponse;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassionHomeResponse {
    private HobbyResponse hobby;
    private List<ProjectResponse> activeProjects;
    private List<ProjectResponse> completedProjects;
    private List<ProjectTemplateResponse> suggestedProjects;
    private int completedCount;
}

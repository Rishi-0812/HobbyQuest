package com.example.hobbyquest_backend.project;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomProjectResponse {
    private List<ProjectResponse> suggestions;
    private Long progressId;
}

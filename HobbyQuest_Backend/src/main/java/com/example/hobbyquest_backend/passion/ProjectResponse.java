package com.example.hobbyquest_backend.passion;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private Long hobbyId;
    private String title;
    private String description;
    private String status;
    private String templateKey;
    private String coverImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}

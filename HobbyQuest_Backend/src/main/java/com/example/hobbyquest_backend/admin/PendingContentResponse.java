package com.example.hobbyquest_backend.admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PendingContentResponse {
    private Long id;
    private String contentType;
    private String hobbyName;
    private String hobbyType;
    private Long targetHobbyId;
    private LocalDateTime generatedAt;
    private String editedJson;
    private String status;
    private String difficulty;
    private String projectName;
    private Integer targetCount;
    private String unitLabel;
    private String unitLabelPlural;
    private Integer durationDays;
}

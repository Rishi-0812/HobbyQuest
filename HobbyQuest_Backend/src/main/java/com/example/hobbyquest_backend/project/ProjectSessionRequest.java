package com.example.hobbyquest_backend.project;

import lombok.Data;

@Data
public class ProjectSessionRequest {
    private String vibe;
    private String note;
    private Integer completedUnits; // 0 is valid
}

package com.example.hobbyquest_backend.admin;

import lombok.Data;

@Data
public class GenerateRoadmapRequest {
    private String hobbyName;
    private String difficulty;
    private String extraGuidance;
}

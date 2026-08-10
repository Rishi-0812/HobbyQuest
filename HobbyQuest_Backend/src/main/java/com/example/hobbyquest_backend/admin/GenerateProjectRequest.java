package com.example.hobbyquest_backend.admin;

import lombok.Data;

@Data
public class GenerateProjectRequest {
    private Long targetHobbyId;
    private String concept;
    private Integer targetCount;
    private String unitLabel;
    private String unitLabelPlural;
    private Integer durationDays;
}

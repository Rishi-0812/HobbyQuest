package com.example.hobbyquest_backend.project;

import lombok.Data;

import java.util.List;

@Data
public class CustomProjectRequest {
    private Long hobbyId;
    private String name;
    private String description;
    private Integer targetCount;
    private String unitLabel;
    private List<String> unitNames;
    private Boolean isPublic;
    private Boolean forceCreate;
    private Integer durationDays; // optional time limit in days
}

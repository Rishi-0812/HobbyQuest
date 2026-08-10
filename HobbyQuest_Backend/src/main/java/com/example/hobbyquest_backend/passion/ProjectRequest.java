package com.example.hobbyquest_backend.passion;

import lombok.Data;

@Data
public class ProjectRequest {
    private String title;
    private String description;
    private String templateKey;
    private String coverImageUrl;
}

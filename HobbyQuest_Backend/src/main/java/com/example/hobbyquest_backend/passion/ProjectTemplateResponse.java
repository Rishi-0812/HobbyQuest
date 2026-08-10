package com.example.hobbyquest_backend.passion;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTemplateResponse {
    private String key;
    private String title;
    private String description;
    private String duration;
}

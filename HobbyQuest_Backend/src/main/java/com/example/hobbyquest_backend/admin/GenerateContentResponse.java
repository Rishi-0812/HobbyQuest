package com.example.hobbyquest_backend.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GenerateContentResponse {
    private Long id;
    private String rawJson;
}

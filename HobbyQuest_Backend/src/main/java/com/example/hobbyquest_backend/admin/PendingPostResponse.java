package com.example.hobbyquest_backend.admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PendingPostResponse {
    private Long id;
    private String caption;
    private String imageUrl;
    private String postType;
    private String posterName;
    private String hobbyName;
    private LocalDateTime createdAt;
}

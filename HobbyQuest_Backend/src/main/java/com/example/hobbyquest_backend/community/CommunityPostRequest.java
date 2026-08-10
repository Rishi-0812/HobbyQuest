package com.example.hobbyquest_backend.community;

import lombok.Data;

@Data
public class CommunityPostRequest {
    private Long hobbyId;
    private String postType;
    private String caption;
    private String imageUrl;
}

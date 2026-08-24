// CommunityPostResponse.java (new DTO, or add fields to whatever exists)
package com.example.hobbyquest_backend.community;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CommunityPostResponse {
    private Long id;
    private String posterName;
    private Long hobbyId;
    private String hobbyName;
    private String postType;
    private String caption;
    private String imageUrl;
    private LocalDateTime createdAt;
}
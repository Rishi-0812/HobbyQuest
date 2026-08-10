package com.example.hobbyquest_backend.feedback;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionResponse {
    private Long id;
    private String hobbyName;
    private String message;
    private Integer voteCount;
    private Boolean hasVoted;
    private LocalDateTime createdAt;
}
package com.example.hobbyquest_backend.skill;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UpgradeResponse {
    private String newStatus;
    private String message;
}
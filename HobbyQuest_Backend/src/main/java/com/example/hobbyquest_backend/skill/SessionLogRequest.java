package com.example.hobbyquest_backend.skill;

import lombok.Data;

@Data
public class SessionLogRequest {
    private String vibe;  // STRUGGLING | GETTING_THE_HANG_OF_IT | NAILED_IT
    private String note;  // optional, max 100 chars
}
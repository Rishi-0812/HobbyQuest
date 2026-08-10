package com.example.hobbyquest_backend.project;

import com.example.hobbyquest_backend.session.SessionLog;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveProjectResponse {
    private Long progressId;
    private Long projectId;
    private String projectName;
    private String unitLabel;
    private Integer targetCount;
    private Integer currentCount;
    private Boolean isComplete;
    private String currentPrompt;
    private String nextPrompt;   // NEW — the prompt for currentCount + 2
    private Long cooldownRemainingMs;
    private List<SessionLog> recentSessions;
    private Boolean isOverdue;
    private Integer sessionsLogged;
    private Integer totalXpEarned;
}
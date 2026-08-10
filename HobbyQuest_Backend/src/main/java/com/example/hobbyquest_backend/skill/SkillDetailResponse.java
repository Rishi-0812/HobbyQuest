package com.example.hobbyquest_backend.skill;

import com.example.hobbyquest_backend.session.SessionLog;
import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SkillDetailResponse {
    private Long            skillId;
    private String          name;
    private String          description;
    private String          tip;
    private boolean         isStruggledTip;
    private String          status;
    private int             attemptCount;
    private long            cooldownRemainingMs;
    private List<SessionLog> recentSessions;
}
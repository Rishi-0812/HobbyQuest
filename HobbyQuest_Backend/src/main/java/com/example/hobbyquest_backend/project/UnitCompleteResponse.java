package com.example.hobbyquest_backend.project;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitCompleteResponse {
    private Integer newCount;
    private Boolean isComplete;
    private Integer xpEarned;
    private Integer totalXp;
    private Boolean projectJustCompleted;
    private Integer totalSkills;
    private Integer daysTaken;
}

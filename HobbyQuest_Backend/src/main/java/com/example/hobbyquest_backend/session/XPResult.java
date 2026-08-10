package com.example.hobbyquest_backend.session;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XPResult {
    private int     xpEarned;
    private int     newTotalXp;
    private int     newLevel;
    private boolean leveledUp;
}
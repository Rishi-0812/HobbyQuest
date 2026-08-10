package com.example.hobbyquest_backend.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalStructuredHobbies;
    private long totalPassionHobbies;
    private long pendingSuggestionsCount;
    private long pendingContentCount;
    private long unapprovedPostsCount;
    private String mostPopularHobbyName;
}

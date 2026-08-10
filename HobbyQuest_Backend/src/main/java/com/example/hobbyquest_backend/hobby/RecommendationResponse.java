package com.example.hobbyquest_backend.hobby;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private List<HobbyResponse> structured;
    private List<HobbyResponse> passion;
}
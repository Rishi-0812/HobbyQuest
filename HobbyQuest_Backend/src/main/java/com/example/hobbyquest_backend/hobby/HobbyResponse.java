package com.example.hobbyquest_backend.hobby;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HobbyResponse {
    private Long     id;
    private String   name;
    private String   type;
    private String   description;
    private String[] tags;
    private String   difficulty;
    private String   emoji;
    private boolean  enrolled; // true if this user is already enrolled
}
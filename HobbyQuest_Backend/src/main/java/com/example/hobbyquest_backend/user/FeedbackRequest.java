package com.example.hobbyquest_backend.user;

import lombok.Data;

@Data
public class FeedbackRequest {
    private String type;
    private String hobbyName;
    private String message;
    private String imageUrl; // NEW — optional screenshot URL from Cloudinary
}
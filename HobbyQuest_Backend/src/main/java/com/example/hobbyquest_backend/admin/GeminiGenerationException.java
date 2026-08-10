package com.example.hobbyquest_backend.admin;

public class GeminiGenerationException extends RuntimeException {
    public GeminiGenerationException(String message) {
        super(message);
    }

    public GeminiGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}

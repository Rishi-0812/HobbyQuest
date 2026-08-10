package com.example.hobbyquest_backend.admin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiGeneratedContentRepository extends JpaRepository<AiGeneratedContent, Long> {
    List<AiGeneratedContent> findByStatusOrderByGeneratedAtDesc(String status);
    List<AiGeneratedContent> findByContentTypeAndStatusOrderByGeneratedAtDesc(String contentType, String status);
    long countByStatus(String status);
}

package com.example.hobbyquest_backend.passion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PassionProjectRepository extends JpaRepository<PassionProject, Long> {
    List<PassionProject> findByUserIdAndHobbyIdOrderByCreatedAtDesc(Long userId, Long hobbyId);
    List<PassionProject> findByUserIdAndHobbyIdAndStatusOrderByCreatedAtDesc(Long userId, Long hobbyId, String status);
    Optional<PassionProject> findByIdAndUserId(Long id, Long userId);
    int countByUserIdAndHobbyIdAndStatus(Long userId, Long hobbyId, String status);
}

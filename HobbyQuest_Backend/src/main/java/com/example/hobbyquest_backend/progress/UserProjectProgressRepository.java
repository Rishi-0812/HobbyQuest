package com.example.hobbyquest_backend.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserProjectProgressRepository extends JpaRepository<UserProjectProgress, Long> {
    Optional<UserProjectProgress> findByUserIdAndProjectId(Long userId, Long projectId);
    List<UserProjectProgress> findByUserIdAndHobbyId(Long userId, Long hobbyId);
    List<UserProjectProgress> findByUserIdAndHobbyIdAndStatus(Long userId, Long hobbyId, String status);
    Optional<UserProjectProgress> findByIdAndUserId(Long id, Long userId);

    int countByUserIdAndStatus(Long userId, String status);
    List<UserProjectProgress> findByUserIdAndStatus(Long userId, String status);
    List<UserProjectProgress> findByUserIdAndStatusAndIsCompleteFalse(Long userId, String status);
}

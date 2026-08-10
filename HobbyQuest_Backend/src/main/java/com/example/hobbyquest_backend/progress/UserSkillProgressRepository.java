package com.example.hobbyquest_backend.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSkillProgressRepository extends JpaRepository<UserSkillProgress, Long> {

    Optional<UserSkillProgress> findByUserIdAndSkillId(Long userId, Long skillId);

    List<UserSkillProgress> findByUserIdAndHobbyId(Long userId, Long hobbyId);

    boolean existsByUserIdAndSkillId(Long userId, Long skillId);
}
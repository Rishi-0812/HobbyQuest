package com.example.hobbyquest_backend.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectUnitRepository extends JpaRepository<ProjectUnit, Long> {
    Optional<ProjectUnit> findByProjectIdAndUnitNumber(Long projectId, Integer unitNumber);
}

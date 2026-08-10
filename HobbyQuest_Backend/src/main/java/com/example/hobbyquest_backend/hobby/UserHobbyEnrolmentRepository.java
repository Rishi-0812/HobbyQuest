package com.example.hobbyquest_backend.hobby;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserHobbyEnrolmentRepository extends JpaRepository<UserHobbyEnrolment, Long> {

    List<UserHobbyEnrolment> findByUserId(Long userId);

    boolean existsByUserIdAndHobbyId(Long userId, Long hobbyId);

    boolean existsByUserIdAndHobbyIdAndStatus(Long userId, Long hobbyId, String status);

    Optional<UserHobbyEnrolment> findByUserIdAndHobbyId(Long userId, Long hobbyId);

    @Query("SELECT COUNT(uhe) FROM UserHobbyEnrolment uhe " +
            "JOIN uhe.hobby h WHERE uhe.user.id = :userId AND h.type = :hobbyType AND uhe.status = :status")
    long countByUserIdAndHobbyTypeAndStatus(@Param("userId") Long userId,
                                            @Param("hobbyType") String hobbyType,
                                            @Param("status") String status);

    List<UserHobbyEnrolment> findByUserIdAndStatus(Long userId, String status);

    @Query("""
            SELECT h.name
            FROM UserHobbyEnrolment uhe
            JOIN uhe.hobby h
            GROUP BY h.id, h.name
            ORDER BY COUNT(uhe.id) DESC
            """)
    List<String> findMostPopularHobbyNames(Pageable pageable);
}
package com.logiflow.server.repositories.user;

import com.logiflow.server.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.username = :username")
    Optional<User> findByUsernameWithRole(@Param("username") String username);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.userId = :userId")
    Optional<User> findByIdWithRole(@Param("userId") Integer userId);

    int countByRole_RoleIdAndIsActive(Integer roleId, boolean isActive);
    
    int countByIsActive(boolean isActive);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(u) FROM User u")
    long count();
    
    @Query("SELECT u FROM User u WHERE u.lastLogin IS NOT NULL ORDER BY u.lastLogin DESC")
    List<User> findRecentActiveUsers(Pageable pageable);

    // Admin user management methods
    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.role.roleName = :roleName")
    List<User> findByRoleNameWithRole(@Param("roleName") String roleName);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.isActive = true")
    List<User> findActiveUsersWithRole();

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchUsersByUsernameOrEmail(@Param("searchTerm") String searchTerm);

    @Query("SELECT DISTINCT u FROM User u JOIN FETCH u.role ORDER BY u.username")
    List<User> findAllUsersWithRole();

    // Count how many users reference the given profile picture URL
    int countByProfilePictureUrl(String profilePictureUrl);
}

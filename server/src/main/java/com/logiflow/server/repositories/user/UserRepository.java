package com.logiflow.server.repositories.user;

import com.logiflow.server.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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

}

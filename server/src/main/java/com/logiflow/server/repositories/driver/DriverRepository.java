package com.logiflow.server.repositories.driver;

import com.logiflow.server.models.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Integer> {

    @Query("SELECT d FROM Driver d LEFT JOIN FETCH d.user WHERE d.user.userId = :userId")
    Optional<Driver> findByUserId(@Param("userId") Integer userId);
}

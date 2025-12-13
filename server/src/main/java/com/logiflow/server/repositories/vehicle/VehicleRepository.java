package com.logiflow.server.repositories.vehicle;

import com.logiflow.server.models.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    long countByStatus(String status);
    List<Vehicle> findByStatus(String status);
}

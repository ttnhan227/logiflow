package com.logiflow.server.repositories;

import com.logiflow.server.models.TripAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripAssignmentRepository extends JpaRepository<TripAssignment, Integer> {
}

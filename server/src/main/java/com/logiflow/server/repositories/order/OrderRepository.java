package com.logiflow.server.repositories.order;

import com.logiflow.server.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query("SELECT COUNT(o) FROM Order o WHERE o.trip.tripId IN (SELECT t.tripId FROM Trip t JOIN t.tripAssignments ta WHERE ta.driver.driverId = :driverId)")
    Long countByDriverTrips(@Param("driverId") Integer driverId);
}

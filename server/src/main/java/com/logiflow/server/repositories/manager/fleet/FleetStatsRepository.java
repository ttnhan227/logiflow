package com.logiflow.server.repositories.manager.fleet;

import com.logiflow.server.models.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FleetStatsRepository extends JpaRepository<Vehicle, Integer> {

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE LOWER(v.status) = 'available'")
    long countAvailable();

    // Số xe đang được gán (in-use) có thể suy ra từ Trip.active; ở level repo Vehicle không đếm được độc lập
    // nên repo này chỉ cung cấp available + total; in-use sẽ tính ở service bằng Trip active.
}

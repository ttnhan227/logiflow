//package com.logiflow.server.repositories.manager.dashboard;
//
//import com.logiflow.server.models.Trip;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//
//public interface DashboardStatsRepository extends JpaRepository<Trip, Integer> {
//
//    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status IN ('in_progress','assigned')")
//    long countActiveTrips();
//
//    // Các số liệu còn lại của dashboard (orders/vehicles) sẽ lấy từ repo gốc:
//    // OrderRepository, VehicleRepository… để tránh trùng lặp.
//}

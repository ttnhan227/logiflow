package com.logiflow.server.repositories.trip;

import com.logiflow.server.models.TripProgressEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripProgressEventRepository extends JpaRepository<TripProgressEvent, Integer> {
    List<TripProgressEvent> findByTrip_TripIdOrderByCreatedAtAsc(Integer tripId);
}

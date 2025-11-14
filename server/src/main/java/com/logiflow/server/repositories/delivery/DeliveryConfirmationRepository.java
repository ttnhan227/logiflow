package com.logiflow.server.repositories.delivery;

import com.logiflow.server.models.DeliveryConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryConfirmationRepository extends JpaRepository<DeliveryConfirmation, Integer> {
    Optional<DeliveryConfirmation> findByTripTripId(Integer tripId);
}

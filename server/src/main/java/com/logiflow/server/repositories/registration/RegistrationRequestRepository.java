package com.logiflow.server.repositories.registration;

import com.logiflow.server.models.RegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Integer> {
    List<RegistrationRequest> findByStatus(RegistrationRequest.RequestStatus status);
    Optional<RegistrationRequest> findByEmail(String email);
}

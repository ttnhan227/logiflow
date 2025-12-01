package com.logiflow.server.services.registration;

import com.logiflow.server.dtos.auth.DriverRegistrationRequest;

public interface RegistrationRequestService {
    void createDriverRequest(DriverRegistrationRequest request);
}

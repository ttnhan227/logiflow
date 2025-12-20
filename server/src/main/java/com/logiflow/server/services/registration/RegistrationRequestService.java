package com.logiflow.server.services.registration;

import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.dtos.auth.CustomerRegistrationRequest;

public interface RegistrationRequestService {
    void createDriverRequest(DriverRegistrationRequest request);
    void createCustomerRequest(CustomerRegistrationRequest request);
}

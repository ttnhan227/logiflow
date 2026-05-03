package com.logiflow.server.services.registration;

import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.dtos.auth.CustomerRegistrationRequest;
import com.logiflow.server.dtos.auth.LicenseInfoDto;
import com.logiflow.server.models.RegistrationRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface RegistrationRequestService {
    void createDriverRequest(DriverRegistrationRequest request);
    void createCustomerRequest(CustomerRegistrationRequest request);

    List<RegistrationRequest> getAllRequests();
    Optional<RegistrationRequest> getRequestById(Integer id);
    String approveRequest(Integer id, String adminUsername);
    String rejectRequest(Integer id, String adminUsername);
    RegistrationRequest updateRequest(Integer id, Map<String, Object> updates, String adminUsername);
    LicenseInfoDto extractLicenseInfoFromUrl(String imageUrl);
}

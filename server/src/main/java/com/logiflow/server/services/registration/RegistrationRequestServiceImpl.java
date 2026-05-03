package com.logiflow.server.services.registration;

import com.logiflow.server.constants.AuditActions;
import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.dtos.auth.CustomerRegistrationRequest;
import com.logiflow.server.dtos.auth.LicenseInfoDto;
import com.logiflow.server.models.Customer;
import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.models.User;
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.services.admin.AuditLogService;
import com.logiflow.server.services.email.EmailService;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.ai.mistralai.MistralAiChatModel;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RegistrationRequestServiceImpl implements RegistrationRequestService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationRequestServiceImpl.class);

    private final RegistrationRequestRepository registrationRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final MistralAiChatModel mistralChatModel;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${spring.ai.mistralai.api-key:}")
    private String mistralApiKey;

    public RegistrationRequestServiceImpl(
            RegistrationRequestRepository registrationRequestRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            CustomerRepository customerRepository,
            NotificationService notificationService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService,
            MistralAiChatModel mistralChatModel) {
        this.registrationRequestRepository = registrationRequestRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.customerRepository = customerRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
        this.mistralChatModel = mistralChatModel;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public void createDriverRequest(DriverRegistrationRequest req) {
        // Uniqueness checks across users and pending requests
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> { 
            throw new RuntimeException("Email already exists"); 
        });
        registrationRequestRepository.findByEmail(req.getEmail()).ifPresent(r -> { 
            throw new RuntimeException("Email is already pending approval"); 
        });

        Role driverRole = roleRepository.findByRoleName("DRIVER")
                .orElseThrow(() -> new RuntimeException("Driver role not found"));

        RegistrationRequest entity = new RegistrationRequest();
        entity.setEmail(req.getEmail());
        entity.setFullName(req.getFullName());
        entity.setPhone(req.getPhone());
        entity.setRole(driverRole);
        entity.setStatus(RegistrationRequest.RequestStatus.PENDING);
        entity.setCreatedAt(LocalDateTime.now());

        // Map driver fields
        entity.setLicenseNumber(req.getLicenseNumber());
        entity.setLicenseType(req.getLicenseType());
        if (req.getLicenseExpiry() != null && !req.getLicenseExpiry().isBlank()) {
            entity.setLicenseExpiry(parseFlexibleDate(req.getLicenseExpiry()));
        }
        if (req.getLicenseIssueDate() != null && !req.getLicenseIssueDate().isBlank()) {
            entity.setLicenseIssueDate(parseFlexibleDate(req.getLicenseIssueDate()));
        }
        if (req.getDateOfBirth() != null && !req.getDateOfBirth().isBlank()) {
            entity.setDateOfBirth(parseFlexibleDate(req.getDateOfBirth()));
        }
        entity.setAddress(req.getAddress());
        entity.setEmergencyContactName(req.getEmergencyContactName());
        entity.setEmergencyContactPhone(req.getEmergencyContactPhone());
        entity.setLicenseImageUrl(req.getLicenseImageUrl());
        entity.setCvUrl(req.getCvUrl());

        RegistrationRequest saved = registrationRequestRepository.save(entity);
        
        // Send notification to admins about the new driver application
        notificationService.notifyNewRegistrationRequest(
            saved.getEmail(),
            driverRole.getRoleName(),
            saved.getRequestId()
        );
    }

    @Override
    public void createCustomerRequest(CustomerRegistrationRequest req) {
        // Uniqueness checks across users and pending requests
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new RuntimeException("Email already exists");
        });
        registrationRequestRepository.findByEmail(req.getEmail()).ifPresent(r -> {
            throw new RuntimeException("Email is already pending approval");
        });

        Role customerRole = roleRepository.findByRoleName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Customer role not found"));

        RegistrationRequest entity = new RegistrationRequest();
        entity.setEmail(req.getEmail());
        entity.setFullName(req.getFullName());
        entity.setPhone(req.getPhone());
        entity.setRole(customerRole);
        entity.setStatus(RegistrationRequest.RequestStatus.PENDING);
        entity.setCreatedAt(LocalDateTime.now());

        // Map customer/company fields
        entity.setCompanyName(req.getCompanyName());
        entity.setCompanyTaxId(req.getCompanyTaxId());
        entity.setCompanyIndustry(req.getCompanyIndustry());
        entity.setCompanyAddress(req.getCompanyAddress());
        entity.setCompanyPhone(req.getCompanyPhone());
        entity.setCompanyWebsite(req.getCompanyWebsite());
        entity.setBusinessLicenseUrl(req.getBusinessLicenseUrl());
        entity.setTaxCertificateUrl(req.getTaxCertificateUrl());
        entity.setUserPosition(req.getUserPosition());

        RegistrationRequest saved = registrationRequestRepository.save(entity);

        // Send notification to admins about the new customer registration request
        notificationService.notifyNewRegistrationRequest(
            saved.getEmail(),
            customerRole.getRoleName(),
            saved.getRequestId()
        );
    }

    // ======= Admin operations =======

    @Override
    public List<RegistrationRequest> getAllRequests() {
        return registrationRequestRepository.findAll();
    }

    @Override
    public Optional<RegistrationRequest> getRequestById(Integer id) {
        return registrationRequestRepository.findById(id);
    }

    @Override
    public String approveRequest(Integer id, String adminUsername) {
        RegistrationRequest req = registrationRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Request already processed");
        }

        if (req.getRole() != null && "DRIVER".equalsIgnoreCase(req.getRole().getRoleName())) {
            req.setStatus(RegistrationRequest.RequestStatus.APPROVED);
            registrationRequestRepository.save(req);

            try {
                emailService.sendDriverApplicationAcceptedEmail(req.getEmail(), req.getFullName());
            } catch (Exception e) {
                logger.error("Failed to send driver acceptance email to {}: {}", req.getEmail(), e.getMessage(), e);
            }

            auditLogService.log(AuditActions.APPROVE_REGISTRATION, adminUsername, "ADMIN",
                    "Moved driver application to interview stage for: " + req.getEmail());

            return "Driver application approved for interview stage. Notification email sent to " + req.getEmail() + ".";
        }

        String generatedUsername = generateUniqueUsername(req);
        String tempPassword = generateTempPassword();

        User user = new User();
        user.setUsername(generatedUsername);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setFullName(req.getFullName());
        user.setDateOfBirth(req.getDateOfBirth());
        user.setAddress(req.getAddress());
        user.setRole(req.getRole());
        user.setIsActive(true);
        userRepository.save(user);

        if (req.getRole() != null && "CUSTOMER".equalsIgnoreCase(req.getRole().getRoleName())) {
            Customer customer = new Customer();
            customer.setUser(user);
            customer.setCompanyName(req.getCompanyName());
            customer.setCompanyCode(generateCompanyCode(req.getCompanyName()));
            customer.setDefaultDeliveryAddress(req.getCompanyAddress());
            customer.setTotalOrders(0);
            customer.setTotalSpent(BigDecimal.ZERO);
            customerRepository.save(customer);
        }

        req.setStatus(RegistrationRequest.RequestStatus.APPROVED);
        registrationRequestRepository.save(req);

        try {
            emailService.sendRegistrationApprovalEmail(
                user.getEmail(), user.getFullName(), user.getUsername(),
                tempPassword, req.getRole().getRoleName());
        } catch (Exception e) {
            logger.error("Failed to send approval email to {}: {}", user.getEmail(), e.getMessage(), e);
        }

        auditLogService.log(AuditActions.APPROVE_REGISTRATION, adminUsername, "ADMIN",
                "Approved registration for: " + user.getUsername() + " (Role: " + req.getRole().getRoleName() + ")");

        return "Request approved. Created account username='" + user.getUsername() +
               "' with temporary password='" + tempPassword + "'. Welcome email sent to " + user.getEmail() + ".";
    }

    @Override
    public String rejectRequest(Integer id, String adminUsername) {
        RegistrationRequest req = registrationRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Request already processed");
        }

        req.setStatus(RegistrationRequest.RequestStatus.REJECTED);
        registrationRequestRepository.save(req);

        if (req.getRole() != null && "DRIVER".equalsIgnoreCase(req.getRole().getRoleName())) {
            try {
                emailService.sendDriverApplicationRejectedEmail(req.getEmail(), req.getFullName());
            } catch (Exception e) {
                logger.error("Failed to send driver rejection email to {}: {}", req.getEmail(), e.getMessage(), e);
            }
        }

        auditLogService.log(AuditActions.REJECT_REGISTRATION, adminUsername, "ADMIN",
                "Rejected registration for: " + req.getEmail() +
                (req.getRole() != null ? " (Role: " + req.getRole().getRoleName() + ")" : ""));

        return "Request rejected successfully";
    }

    @Override
    public RegistrationRequest updateRequest(Integer id, Map<String, Object> updates, String adminUsername) {
        RegistrationRequest req = registrationRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != RegistrationRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Cannot edit a processed request");
        }

        if (updates.containsKey("fullName")) req.setFullName((String) updates.get("fullName"));
        if (updates.containsKey("phone")) req.setPhone((String) updates.get("phone"));
        if (updates.containsKey("address")) req.setAddress((String) updates.get("address"));
        if (updates.containsKey("licenseNumber")) req.setLicenseNumber((String) updates.get("licenseNumber"));
        if (updates.containsKey("licenseType")) req.setLicenseType((String) updates.get("licenseType"));
        if (updates.containsKey("emergencyContactName")) req.setEmergencyContactName((String) updates.get("emergencyContactName"));
        if (updates.containsKey("emergencyContactPhone")) req.setEmergencyContactPhone((String) updates.get("emergencyContactPhone"));

        if (updates.containsKey("dateOfBirth")) {
            String s = (String) updates.get("dateOfBirth");
            req.setDateOfBirth(s != null && !s.trim().isEmpty() ? LocalDate.parse(s) : null);
        }
        if (updates.containsKey("licenseExpiry")) {
            String s = (String) updates.get("licenseExpiry");
            req.setLicenseExpiry(s != null && !s.trim().isEmpty() ? LocalDate.parse(s) : null);
        }

        RegistrationRequest saved = registrationRequestRepository.save(req);

        auditLogService.log(AuditActions.UPDATE_REGISTRATION_REQUEST, adminUsername, "ADMIN",
                "Updated registration request for: " + req.getEmail());

        return saved;
    }

    // ======= Username / password / company code helpers =======

    private String generateUniqueUsername(RegistrationRequest req) {
        String base;
        if (req.getEmail() != null && req.getEmail().contains("@")) {
            base = req.getEmail().substring(0, req.getEmail().indexOf('@'));
        } else if (req.getFullName() != null && !req.getFullName().isBlank()) {
            base = req.getFullName().trim().toLowerCase().replaceAll("[^a-z0-9]+", ".");
        } else {
            base = "driver";
        }

        base = base.toLowerCase();
        if (base.length() > 30) base = base.substring(0, 30);
        if (base.isBlank()) base = "driver";

        String candidate = base;
        int attempt = 0;
        while (userRepository.findByUsername(candidate).isPresent()) {
            attempt++;
            candidate = base + "." + (1000 + (int) (Math.random() * 9000));
            if (attempt > 20) {
                candidate = "driver." + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }
        return candidate;
    }

    private String generateTempPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String generateCompanyCode(String companyName) {
        if (companyName == null || companyName.trim().isEmpty()) {
            return "COMP" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        String base = companyName.trim().toUpperCase()
            .replaceAll("[^A-Z0-9]", "")
            .substring(0, Math.min(8, companyName.length()));

        if (base.length() < 4) base = "COMP" + base;

        String candidate = base;
        int attempt = 0;
        while (customerRepository.findByCompanyCode(candidate).isPresent()) {
            attempt++;
            candidate = base + (100 + (int) (Math.random() * 900));
            if (attempt > 20) {
                candidate = "COMP" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                break;
            }
        }
        return candidate;
    }

    public LicenseInfo extractLicenseInfo(String imageUrl) {
        logger.info("Starting AI-only license extraction for image URL: {}", imageUrl);

        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            logger.warn("AI extraction failed: No license image provided");
            return new LicenseInfo("No license image provided");
        }

        String ocrText = extractTextFromImageWithMistralOcr(imageUrl);
        if (ocrText == null || ocrText.isBlank()) {
            logger.warn("AI extraction failed: OCR returned empty text for image URL: {}", imageUrl);
            return new LicenseInfo("AI OCR could not read any text from the image. Please upload a clearer license image.");
        }

        LicenseInfo result = parseWithAIFromExtractedText(ocrText);
        if (result != null && result.isExtractionSuccessful()) {
            sanitizeExtractedLicenseInfo(result);

            if (isLikelyPlaceholderExtraction(result)) {
                logger.warn("AI extraction rejected due to placeholder-like values: license={}, name={}",
                        result.getLicenseNumber(), result.getFullName());
                return new LicenseInfo("AI extraction produced placeholder content. Please upload a clearer image or enter details manually.");
            }

            logger.info("AI extraction successful - License: {}, Type: {}, Expiry: {}, Name: {}, DOB: {}, Address: {}",
                    result.getLicenseNumber(), result.getLicenseType(), result.getExpiryDate(),
                    result.getFullName(), result.getDateOfBirth(), result.getAddress());
            return result;
        }

        logger.warn("AI extraction failed for image URL: {}", imageUrl);
        return new LicenseInfo("AI could not extract license information. Please verify image quality or enter details manually.");
    }

    private LocalDate parseFlexibleDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        // Try ISO format first (yyyy-MM-dd)
        try {
            return LocalDate.parse(dateStr.trim());
        } catch (DateTimeParseException e) {
            // Try other formats
        }

        // Try various date formats
        String[] formats = {
            "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy", "MM-dd-yyyy",
            "dd/MM/yy", "MM/dd/yy", "dd-MM-yy", "MM-dd-yy"
        };

        for (String format : formats) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
                return LocalDate.parse(dateStr.trim(), formatter);
            } catch (DateTimeParseException e) {
                continue;
            }
        }

        // If all parsing fails, throw an exception
        throw new RuntimeException("Invalid date format: " + dateStr + ". Expected formats: yyyy-MM-dd, dd/MM/yyyy, MM/dd/yyyy, etc.");
    }

    private String extractTextFromImageWithMistralOcr(String imageUrl) {
        if (mistralApiKey == null || mistralApiKey.isBlank()) {
            throw new RuntimeException("MISTRAL API key is missing for OCR extraction");
        }

        try {
            var payload = objectMapper.createObjectNode();
            payload.put("model", "mistral-ocr-latest");

            var documentNode = payload.putObject("document");
            documentNode.put("type", "image_url");
            documentNode.put("image_url", imageUrl);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.mistral.ai/v1/ocr"))
                    .header("Authorization", "Bearer " + mistralApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                logger.error("Mistral OCR API error {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Mistral OCR API failed with status " + response.statusCode());
            }

            String ocrText = parseMistralOcrText(response.body());
            logger.debug("OCR extracted text length: {}", ocrText != null ? ocrText.length() : 0);
            return ocrText;
        } catch (Exception e) {
            logger.error("Mistral OCR extraction failed: {}", e.getMessage(), e);
            return null;
        }
    }

    private String parseMistralOcrText(String responseBody) throws IOException {
        var root = objectMapper.readTree(responseBody);
        StringBuilder mergedText = new StringBuilder();

        var pages = root.path("pages");
        if (pages.isArray()) {
            for (var page : pages) {
                String markdown = page.path("markdown").asText("");
                if (!markdown.isBlank()) {
                    if (!mergedText.isEmpty()) {
                        mergedText.append("\n\n");
                    }
                    mergedText.append(markdown);
                }
            }
        }

        if (mergedText.isEmpty()) {
            String fallbackText = root.path("text").asText("");
            if (!fallbackText.isBlank()) {
                mergedText.append(fallbackText);
            }
        }

        return mergedText.toString().trim();
    }

    private LicenseInfo parseWithAIFromExtractedText(String ocrText) {
        try {
            String prompt = "You are extracting fields from OCR text of a driver's license. " +
                    "Use ONLY the OCR text below. Do not fabricate values. " +
                    "If a field is unclear or missing, return null for that field.\n\n" +
                    "Extract into this exact JSON format:\n" +
                    "{\n" +
                    "  \"full_name\": \"corrected full name or null\",\n" +
                    "  \"license_number\": \"license number or null\",\n" +
                    "  \"license_type\": \"license type or null\",\n" +
                    "  \"expiry_date\": \"YYYY-MM-DD or null\",\n" +
                    "  \"issue_date\": \"YYYY-MM-DD or null\",\n" +
                    "  \"date_of_birth\": \"YYYY-MM-DD or null\",\n" +
                    "  \"address\": \"full address or null\"\n" +
                    "}\n\n" +
                    "OCR text:\n" + ocrText + "\n\n" +
                    "Return ONLY the JSON object.";

            String aiResponse = mistralChatModel.call(prompt);
            logger.debug("AI response (from OCR text): {}", aiResponse);
            return parseAiJsonResponse(aiResponse);
        } catch (Exception e) {
            logger.error("AI field parsing failed: {}", e.getMessage(), e);
            return null;
        }
    }

    private boolean isLikelyPlaceholderExtraction(LicenseInfo info) {
        String name = safeUpper(info.getFullName());
        String address = safeUpper(info.getAddress());
        String license = safeUpper(info.getLicenseNumber());

        boolean dummyName = "JOHN DOE".equals(name) || "JANE DOE".equals(name);
        boolean dummyAddress = address.contains("SPRINGFIELD") && address.contains("MAIN ST");
        boolean dummyLicense = license.matches("D\\d{7}");

        return dummyName && (dummyAddress || dummyLicense);
    }

    private void sanitizeExtractedLicenseInfo(LicenseInfo info) {
        info.setLicenseType(normalizeLicenseType(info.getLicenseType()));

        LocalDate birthDate = parseIsoDate(info.getDateOfBirth());
        LocalDate issueDate = parseIsoDate(info.getLicenseIssueDate());
        LocalDate expiryDate = parseIsoDate(info.getExpiryDate());
        LocalDate today = LocalDate.now();

        if (birthDate != null) {
            if (birthDate.isAfter(today.minusYears(16)) || birthDate.isBefore(today.minusYears(100))) {
                logger.warn("Discarding suspicious OCR birth date: {}", info.getDateOfBirth());
                info.setDateOfBirth(null);
                birthDate = null;
            }
        }

        if (issueDate != null) {
            if (birthDate != null && issueDate.isBefore(birthDate.plusYears(14))) {
                logger.warn("Discarding suspicious OCR issue date: {}", info.getLicenseIssueDate());
                info.setLicenseIssueDate(null);
                issueDate = null;
            } else if (issueDate.isAfter(today.plusYears(1))) {
                logger.warn("Discarding future OCR issue date: {}", info.getLicenseIssueDate());
                info.setLicenseIssueDate(null);
                issueDate = null;
            }
        }

        if (expiryDate != null) {
            if (issueDate != null && expiryDate.isBefore(issueDate)) {
                logger.warn("Discarding expiry date earlier than issue date: {} < {}", info.getExpiryDate(), info.getLicenseIssueDate());
                info.setExpiryDate(null);
            } else if (birthDate != null && expiryDate.isBefore(birthDate.plusYears(14))) {
                logger.warn("Discarding suspicious OCR expiry date: {}", info.getExpiryDate());
                info.setExpiryDate(null);
            }
        }
    }

    private String normalizeLicenseType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            return null;
        }

        String upper = rawType.trim().toUpperCase();
        String[] candidates = upper.split("\s*[,/;|]\s*");

        for (String candidate : candidates) {
            String trimmed = candidate.trim();
            if (trimmed.matches("CLASS\\s+[A-Z]") || trimmed.matches("[A-F][0-9]?") || trimmed.matches("F[A-D]?")) {
                return trimmed;
            }
        }

        return upper;
    }

    private LocalDate parseIsoDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private String safeUpper(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private LicenseInfo parseAiJsonResponse(String aiResponse) throws IOException {
        String cleanJson = aiResponse.trim();
        if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.substring(7);
        }
        if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.substring(3);
        }
        if (cleanJson.endsWith("```")) {
            cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
        }
        cleanJson = cleanJson.trim();

        var jsonNode = objectMapper.readTree(cleanJson);
        String fullName = jsonNode.get("full_name").asText(null);
        String licenseNumber = jsonNode.get("license_number").asText(null);
        String licenseType = jsonNode.get("license_type").asText(null);
        String expiryDate = jsonNode.get("expiry_date").asText(null);
        String issueDate = jsonNode.get("issue_date").asText(null);
        String dateOfBirth = jsonNode.get("date_of_birth").asText(null);
        String address = jsonNode.get("address").asText(null);

        return new LicenseInfo(licenseNumber, licenseType, expiryDate, issueDate, fullName, dateOfBirth, address);
    }

    public static class LicenseInfo {
        private String licenseNumber;
        private String licenseType;
        private String expiryDate;
        private String licenseIssueDate;
        private String fullName;
        private String dateOfBirth;
        private String address;
        private boolean extractionSuccessful;
        private String errorMessage;

        public LicenseInfo() {}

        public LicenseInfo(String licenseNumber, String licenseType, String expiryDate, String licenseIssueDate, String fullName, String dateOfBirth, String address) {
            this.licenseNumber = licenseNumber;
            this.licenseType = licenseType;
            this.expiryDate = expiryDate;
            this.licenseIssueDate = licenseIssueDate;
            this.fullName = fullName;
            this.dateOfBirth = dateOfBirth;
            this.address = address;
            this.extractionSuccessful = true;
        }

        public LicenseInfo(String errorMessage) {
            this.extractionSuccessful = false;
            this.errorMessage = errorMessage;
        }

        // Getters and setters
        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
        public String getLicenseType() { return licenseType; }
        public void setLicenseType(String licenseType) { this.licenseType = licenseType; }
        public String getExpiryDate() { return expiryDate; }
        public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }
        public String getLicenseIssueDate() { return licenseIssueDate; }
        public void setLicenseIssueDate(String licenseIssueDate) { this.licenseIssueDate = licenseIssueDate; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public boolean isExtractionSuccessful() { return extractionSuccessful; }
        public void setExtractionSuccessful(boolean extractionSuccessful) { this.extractionSuccessful = extractionSuccessful; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    public LicenseInfoDto extractLicenseInfoFromUrl(String imageUrl) {
        LicenseInfo info = extractLicenseInfo(imageUrl);
        LicenseInfoDto dto = new LicenseInfoDto();
        dto.setLicenseNumber(info.getLicenseNumber());
        dto.setLicenseType(info.getLicenseType());
        dto.setExpiryDate(info.getExpiryDate());
        dto.setIssueDate(info.getLicenseIssueDate());
        dto.setFullName(info.getFullName());
        dto.setDateOfBirth(info.getDateOfBirth());
        dto.setAddress(info.getAddress());
        dto.setExtractionSuccessful(info.isExtractionSuccessful());
        dto.setErrorMessage(info.getErrorMessage());
        return dto;
    }
}

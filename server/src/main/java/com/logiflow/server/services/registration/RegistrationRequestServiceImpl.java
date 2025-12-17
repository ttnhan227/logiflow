package com.logiflow.server.services.registration;

import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.websocket.NotificationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.opencv.core.*;
import org.opencv.imgproc.Imgproc;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import javax.imageio.ImageIO;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RegistrationRequestServiceImpl implements RegistrationRequestService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationRequestServiceImpl.class);

    private final RegistrationRequestRepository registrationRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;
    private final ITesseract tesseract;

    @Value("${ocr.enabled:true}")
    private boolean ocrEnabled;

    @Value("${ocr.tessdata.path:}")
    private String tessdataPath;

    @Value("${ocr.language:eng}")
    private String ocrLanguage;

    public RegistrationRequestServiceImpl(
            RegistrationRequestRepository registrationRequestRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            NotificationService notificationService) {
        this.registrationRequestRepository = registrationRequestRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.notificationService = notificationService;
        this.restTemplate = new RestTemplate();
        this.tesseract = new Tesseract();

        // Configure Tesseract datapath
        if (tessdataPath != null && !tessdataPath.isEmpty()) {
            tesseract.setDatapath(tessdataPath);
        } else {
            // Fallback to TESSDATA_PREFIX environment variable
            String envTessdata = System.getenv("TESSDATA_PREFIX");
            if (envTessdata != null && !envTessdata.isEmpty()) {
                tesseract.setDatapath(envTessdata);
            }
        }

        tesseract.setLanguage(ocrLanguage);
        // Improve OCR accuracy for documents
        tesseract.setPageSegMode(6); // Uniform block of text
        tesseract.setOcrEngineMode(1); // Neural nets LSTM engine

        // Load OpenCV native library
        nu.pattern.OpenCV.loadLocally();
    }

    @Override
    public void createDriverRequest(DriverRegistrationRequest req) {
        // Uniqueness checks across users and pending requests
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> { throw new RuntimeException("Email already exists"); });
        registrationRequestRepository.findByEmail(req.getEmail()).ifPresent(r -> { throw new RuntimeException("Email is already pending approval"); });

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
            entity.setLicenseExpiry(LocalDate.parse(req.getLicenseExpiry()));
        }
        if (req.getDateOfBirth() != null && !req.getDateOfBirth().isBlank()) {
            entity.setDateOfBirth(LocalDate.parse(req.getDateOfBirth()));
        }
        entity.setAddress(req.getAddress());
        entity.setEmergencyContactName(req.getEmergencyContactName());
        entity.setEmergencyContactPhone(req.getEmergencyContactPhone());
        entity.setLicenseImageUrl(req.getLicenseImageUrl());
        entity.setCvUrl(req.getCvUrl());

        RegistrationRequest saved = registrationRequestRepository.save(entity);
        
        // Send notification to admins about new registration request
        notificationService.notifyNewRegistrationRequest(
            saved.getEmail(),
            driverRole.getRoleName(),
            saved.getRequestId()
        );
    }

    // OCR functionality merged into this service

    public LicenseInfo extractLicenseInfo(String imageUrl) {
        logger.info("Starting OCR extraction for image URL: {}", imageUrl);

        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            logger.warn("OCR failed: No license image provided");
            return new LicenseInfo("No license image provided");
        }

        if (!ocrEnabled) {
            logger.warn("OCR failed: OCR is disabled in configuration");
            return new LicenseInfo("OCR is disabled. Enable in application.properties to extract license information.");
        }

        try {
            logger.debug("Downloading image from URL: {}", imageUrl);
            BufferedImage originalImage = downloadImageAsBufferedImage(imageUrl);
            logger.debug("Image downloaded successfully, dimensions: {}x{}", originalImage.getWidth(), originalImage.getHeight());

            // Apply OpenCV preprocessing for license documents
            logger.debug("Applying OpenCV preprocessing for license document");
            BufferedImage processedImage = preprocessLicenseDocument(originalImage);
            logger.debug("Preprocessing completed, new dimensions: {}x{}", processedImage.getWidth(), processedImage.getHeight());

            // Configure Tesseract for document OCR
            configureTesseractForDocuments();

            logger.debug("Performing OCR on processed image");
            String extractedText = tesseract.doOCR(processedImage);
            logger.debug("OCR completed, extracted text length: {}", extractedText.length());

            LicenseInfo result = parseLicenseInfo(extractedText);
            if (result.isExtractionSuccessful()) {
                logger.info("OCR extraction successful - License: {}, Type: {}, Expiry: {}",
                    result.getLicenseNumber(), result.getLicenseType(), result.getExpiryDate());
            } else {
                logger.warn("OCR extraction failed to parse license info: {}", result.getErrorMessage());
            }

            return result;

        } catch (TesseractException e) {
            logger.error("Tesseract OCR processing failed for URL: {} - Error: {}", imageUrl, e.getMessage(), e);
            return new LicenseInfo("OCR processing failed: " + e.getMessage());
        } catch (IOException e) {
            logger.error("Image download/processing failed for URL: {} - Error: {}", imageUrl, e.getMessage(), e);
            return new LicenseInfo("Failed to download or process image: " + e.getMessage());
        } catch (Throwable e) {
            logger.error("Unexpected error during OCR processing for URL: {} - Error: {}", imageUrl, e.getMessage(), e);
            return new LicenseInfo("Unexpected error during OCR processing: " + e.getMessage());
        }
    }

    private BufferedImage downloadImageAsBufferedImage(String imageUrl) throws IOException {
        // Download image bytes
        byte[] imageBytes = downloadImage(imageUrl);
        if (imageBytes == null || imageBytes.length == 0) {
            throw new IOException("Failed to download image from URL: " + imageUrl);
        }

        // Convert to BufferedImage
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(imageBytes)) {
            BufferedImage image = ImageIO.read(bais);
            if (image == null) {
                throw new IOException("Failed to decode image format");
            }
            return image;
        }
    }

    private byte[] downloadImage(String imageUrl) {
        try {
            // If it's a local file path (for development)
            if (imageUrl.startsWith("file://") || !imageUrl.contains("://")) {
                String filePath = imageUrl.replace("file://", "");
                return Files.readAllBytes(Paths.get(filePath));
            }

            // For HTTP URLs
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "LogiFlow-OCR/1.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                imageUrl,
                HttpMethod.GET,
                entity,
                byte[].class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            } else {
                throw new IOException("HTTP " + response.getStatusCode() + " downloading image");
            }
        } catch (Exception e) {
            System.err.println("Error downloading image: " + e.getMessage());
            return null;
        }
    }

    private LicenseInfo parseLicenseInfo(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new LicenseInfo("No text extracted from image");
        }

        logger.debug("Extracted OCR text: {}", text);

        String licenseNumber = extractLicenseNumber(text);
        String licenseType = extractLicenseType(text);
        String expiryDate = extractExpiryDate(text);

        // More lenient validation - accept any partial extraction
        boolean hasPartialData = licenseNumber != null || licenseType != null || expiryDate != null;
        
        if (hasPartialData) {
            logger.info("OCR extracted partial data - License: {}, Type: {}, Expiry: {}", 
                licenseNumber, licenseType, expiryDate);
            return new LicenseInfo(licenseNumber, licenseType, expiryDate);
        } else {
            logger.warn("OCR could not extract any license information from text: {}", text.substring(0, Math.min(100, text.length())));
            return new LicenseInfo("Could not extract license information. Image may be unclear or text not recognizable.");
        }
    }

    private String extractLicenseNumber(String text) {
        // More comprehensive patterns for license numbers including Vietnamese formats
        Pattern[] patterns = {
            // Standard license number patterns
            Pattern.compile("(?i)(?:license|lic|no|number|#)[:\\s]*([A-Z0-9]{4,15})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i)(?:driver'?s?\\s*license|dl)[:\\s]*([A-Z0-9]{4,15})", Pattern.CASE_INSENSITIVE),
            
            // Vietnamese license patterns (e.g., 12A-12345, 45B-67890)
            Pattern.compile("(\\d{1,2}[A-Z]-\\d{4,6})"),
            Pattern.compile("(\\d{1,2}[A-Z]\\d{4,6})"),
            
            // Generic alphanumeric patterns
            Pattern.compile("\\b([A-Z]{1,4}[-\\s]?[0-9]{4,12})\\b"),
            Pattern.compile("\\b([0-9]{4,12}[-\\s]?[A-Z]{1,4})\\b"),
            
            // Any long alphanumeric sequence that could be a license number
            Pattern.compile("\\b([A-Z0-9]{6,15})\\b")
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String result = matcher.group(1).toUpperCase().replaceAll("[^A-Z0-9-]", "");
                if (result.length() >= 4) { // Minimum reasonable length
                    logger.debug("Found license number: {}", result);
                    return result;
                }
            }
        }
        return null;
    }

    private String extractLicenseType(String text) {
        // Expanded license types including Vietnamese categories
        String[][] types = {
            // International/Commercial
            {"CLASS A", "CLASS B", "CLASS C", "CLASS D", "CLASS E", "CDL", "COMMERCIAL"},
            // Vietnamese license types
            {"A1", "A2", "A3", "A4", "B1", "B2", "C", "D", "E", "F", "FB", "FC", "FD"},
            // Common descriptors
            {"MOTORCYCLE", "CAR", "TRUCK", "BUS", "HEAVY", "LIGHT", "TEMPORARY"}
        };
        
        String upperText = text.toUpperCase();

        // First check for Vietnamese patterns (more specific)
        for (String type : types[1]) {
            if (upperText.contains(" " + type + " ") || upperText.contains(type + " ") || upperText.contains(" " + type)) {
                logger.debug("Found Vietnamese license type: {}", type);
                return type;
            }
        }

        // Then check for class patterns
        Pattern classPattern = Pattern.compile("(?i)class[:\\s]*([A-Z])");
        Matcher matcher = classPattern.matcher(text);
        if (matcher.find()) {
            String result = "CLASS " + matcher.group(1).toUpperCase();
            logger.debug("Found class license type: {}", result);
            return result;
        }

        // Finally check other types
        for (String[] typeGroup : types) {
            for (String type : typeGroup) {
                if (upperText.contains(type)) {
                    logger.debug("Found license type: {}", type);
                    return type;
                }
            }
        }

        return null;
    }

    private String extractExpiryDate(String text) {
        // Enhanced date patterns including Vietnamese formats
        Pattern[] datePatterns = {
            // Standard expiry patterns
            Pattern.compile("(?i)exp(?:iry)?[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            Pattern.compile("(?i)valid\\s*to[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            Pattern.compile("(?i)expires[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            
            // Vietnamese date patterns (DD/MM/YYYY)
            Pattern.compile("(\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})"),
            Pattern.compile("(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2})"),
            
            // Year-month patterns
            Pattern.compile("(?i)(\\d{4}[/-]\\d{1,2})"),
            
            // Just year (fallback)
            Pattern.compile("\\b(20\\d{2})\\b")
        };

        for (Pattern pattern : datePatterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String dateStr = matcher.group(1);
                if (isValidDate(dateStr)) {
                    String result = formatDate(dateStr);
                    logger.debug("Found expiry date: {} -> {}", dateStr, result);
                    return result;
                }
            }
        }
        return null;
    }

// ... (rest of the code remains the same)
    private boolean isValidDate(String dateStr) {
        try {
            // Try different date formats
            String[] formats = {"MM/dd/yyyy", "dd/MM/yyyy", "MM-dd-yyyy", "dd-MM-yyyy", "MM/dd/yy", "dd/MM/yy"};
            for (String format : formats) {
                try {
                    LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(format));
                    return true;
                } catch (DateTimeParseException e) {
                    continue;
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return false;
    }

    private String formatDate(String dateStr) {
        try {
            // Convert to ISO format (yyyy-MM-dd)
            String[] formats = {"MM/dd/yyyy", "dd/MM/yyyy", "MM-dd-yyyy", "dd-MM-yyyy", "MM/dd/yy", "dd/MM/yy"};
            for (String format : formats) {
                try {
                    LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(format));
                    return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                } catch (DateTimeParseException e) {
                    continue;
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return dateStr; // Return as-is if parsing fails
    }

    /**
     * Applies OpenCV preprocessing pipeline optimized for document OCR (not license plates)
     */
    private BufferedImage preprocessLicenseDocument(BufferedImage originalImage) {
        Mat mat = null;
        try {
            // Convert BufferedImage to OpenCV Mat
            mat = bufferedImageToMat(originalImage);

            // Apply preprocessing pipeline for documents
            // 1. Convert to grayscale
            Imgproc.cvtColor(mat, mat, Imgproc.COLOR_BGR2GRAY);

            // 2. Resize for better OCR (moderate scaling)
            if (mat.width() < 1000 || mat.height() < 1000) {
                Size newSize = new Size(mat.cols() * 1.5, mat.rows() * 1.5);
                Imgproc.resize(mat, mat, newSize, 0, 0, Imgproc.INTER_CUBIC);
            }

            // 3. Apply noise reduction
            Imgproc.GaussianBlur(mat, mat, new Size(3, 3), 0);

            // 4. Contrast enhancement using CLAHE
            var clahe = Imgproc.createCLAHE(2.0, new Size(8, 8));
            clahe.apply(mat, mat);

            // 5. Adaptive threshold for better text contrast
            Imgproc.adaptiveThreshold(mat, mat, 255, Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C,
                Imgproc.THRESH_BINARY, 15, 8);

            // 6. Morphological operations to clean up text
            Mat kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, new Size(2, 2));
            Imgproc.morphologyEx(mat, mat, Imgproc.MORPH_CLOSE, kernel);
            kernel.release();

            // Convert back to BufferedImage
            return matToBufferedImage(mat);
        } catch (Exception e) {
            logger.error("Error in OpenCV preprocessing: {}", e.getMessage(), e);
            // Return original image if preprocessing fails
            return originalImage;
        } finally {
            // Ensure Mat is released to prevent memory leaks
            if (mat != null) {
                mat.release();
            }
        }
    }

    /**
     * Configures Tesseract for document OCR (driver's licenses)
     */
    private void configureTesseractForDocuments() {
        // Configure for full document text (not single line)
        tesseract.setPageSegMode(6); // Uniform block of text

        // Use LSTM OCR engine
        tesseract.setOcrEngineMode(1); // Neural nets LSTM engine

        // Set character whitelist for documents (more comprehensive)
        tesseract.setTessVariable("tessedit_char_whitelist",
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-:.,() ");

        // Improve accuracy for document text
        tesseract.setTessVariable("textord_min_linesize", "2.5");
        
        // Enable automatic orientation detection
        tesseract.setTessVariable("textord_rotation", "90");
    }

    /**
     * Converts BufferedImage to OpenCV Mat with proper format handling
     */
    private Mat bufferedImageToMat(BufferedImage bi) {
        try {
            // Convert image to standard format if needed
            BufferedImage convertedImage = new BufferedImage(bi.getWidth(), bi.getHeight(), BufferedImage.TYPE_3BYTE_BGR);
            convertedImage.getGraphics().drawImage(bi, 0, 0, null);
            
            Mat mat = new Mat(convertedImage.getHeight(), convertedImage.getWidth(), CvType.CV_8UC3);
            byte[] data = ((java.awt.image.DataBufferByte) convertedImage.getRaster().getDataBuffer()).getData();
            mat.put(0, 0, data);
            return mat;
        } catch (Exception e) {
            logger.error("Error converting BufferedImage to Mat: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to convert image format for OpenCV processing", e);
        }
    }

    /**
     * Converts OpenCV Mat to BufferedImage with proper error handling
     */
    private BufferedImage matToBufferedImage(Mat mat) {
        try {
            int type = BufferedImage.TYPE_BYTE_GRAY;
            if (mat.channels() > 1) {
                type = BufferedImage.TYPE_3BYTE_BGR;
            }

            int bufferSize = mat.channels() * mat.cols() * mat.rows();
            byte[] buffer = new byte[bufferSize];
            mat.get(0, 0, buffer);

            BufferedImage image = new BufferedImage(mat.cols(), mat.rows(), type);
            final byte[] targetPixels = ((java.awt.image.DataBufferByte) image.getRaster().getDataBuffer()).getData();
            System.arraycopy(buffer, 0, targetPixels, 0, buffer.length);

            return image;
        } catch (Exception e) {
            logger.error("Error converting Mat to BufferedImage: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to convert OpenCV Mat to image format", e);
        }
    }

    // Inner class for license info
    public static class LicenseInfo {
        private String licenseNumber;
        private String licenseType;
        private String expiryDate;
        private boolean extractionSuccessful;
        private String errorMessage;

        public LicenseInfo() {}

        public LicenseInfo(String licenseNumber, String licenseType, String expiryDate) {
            this.licenseNumber = licenseNumber;
            this.licenseType = licenseType;
            this.expiryDate = expiryDate;
            this.extractionSuccessful = true;
        }

        public LicenseInfo(String errorMessage) {
            this.extractionSuccessful = false;
            this.errorMessage = errorMessage;
        }

        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

        public String getLicenseType() { return licenseType; }
        public void setLicenseType(String licenseType) { this.licenseType = licenseType; }

        public String getExpiryDate() { return expiryDate; }
        public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

        public boolean isExtractionSuccessful() { return extractionSuccessful; }
        public void setExtractionSuccessful(boolean extractionSuccessful) { this.extractionSuccessful = extractionSuccessful; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    // Public API endpoint for OCR extraction
    public LicenseInfo extractLicenseInfoFromUrl(String imageUrl) {
        return extractLicenseInfo(imageUrl);
    }
}

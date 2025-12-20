package com.logiflow.server.services.registration;

import com.logiflow.server.dtos.auth.DriverRegistrationRequest;
import com.logiflow.server.dtos.auth.CustomerRegistrationRequest;
import com.logiflow.server.models.RegistrationRequest;
import com.logiflow.server.models.Role;
import com.logiflow.server.repositories.registration.RegistrationRequestRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import com.logiflow.server.websocket.NotificationService;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.opencv.core.*;
import org.opencv.imgproc.Imgproc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.ai.mistralai.MistralAiChatModel;

import jakarta.annotation.PostConstruct;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import javax.imageio.ImageIO;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RegistrationRequestServiceImpl implements RegistrationRequestService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationRequestServiceImpl.class);

    private final RegistrationRequestRepository registrationRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;
    private final MistralAiChatModel geminiChatModel;
    private final ObjectMapper objectMapper;
    
    // Thread-safe Tesseract pool
    private BlockingQueue<ITesseract> tesseractPool;
    private static final int POOL_SIZE = 4;
    private static final int POOL_TIMEOUT_SECONDS = 30;

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
            NotificationService notificationService,
            MistralAiChatModel geminiChatModel) {
        this.registrationRequestRepository = registrationRequestRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.notificationService = notificationService;
        this.restTemplate = new RestTemplate();
        this.geminiChatModel = geminiChatModel;
        this.objectMapper = new ObjectMapper();
        
        // Load OpenCV native library
        try {
            nu.pattern.OpenCV.loadLocally();
            logger.info("OpenCV loaded successfully");
        } catch (Exception e) {
            logger.error("Failed to load OpenCV", e);
        }
    }

    @PostConstruct
    public void initializeTesseractPool() {
        tesseractPool = new ArrayBlockingQueue<>(POOL_SIZE);
        
        for (int i = 0; i < POOL_SIZE; i++) {
            try {
                ITesseract tesseract = createTesseractInstance();
                tesseractPool.offer(tesseract);
                logger.info("Tesseract instance {} initialized successfully", i + 1);
            } catch (Exception e) {
                logger.error("Failed to initialize Tesseract instance {}", i + 1, e);
            }
        }
        
        if (tesseractPool.isEmpty()) {
            logger.warn("No Tesseract instances were initialized. OCR will be disabled.");
        }
    }

    private ITesseract createTesseractInstance() {
        ITesseract tesseract = new Tesseract();

        if (tessdataPath != null && !tessdataPath.isBlank()) {
            tesseract.setDatapath(tessdataPath);
        }

        tesseract.setLanguage(ocrLanguage);
        tesseract.setOcrEngineMode(1);
        tesseract.setPageSegMode(11);

        // Speed + stability
        tesseract.setTessVariable("user_defined_dpi", "300");

        return tesseract;
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
        
        // Send notification to admins about new registration request
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

        // Send notification to admins about new registration request
        notificationService.notifyNewRegistrationRequest(
            saved.getEmail(),
            customerRole.getRoleName(),
            saved.getRequestId()
        );
    }

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

        ITesseract tesseract = null;
        BufferedImage originalImage = null;
        BufferedImage processedImage = null;
        
        try {
            // Get Tesseract instance from pool
            tesseract = tesseractPool.poll(POOL_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (tesseract == null) {
                logger.error("Failed to acquire Tesseract instance from pool within timeout");
                return new LicenseInfo("OCR service is busy. Please try again.");
            }

            logger.debug("Downloading image from URL: {}", imageUrl);
            originalImage = downloadImageAsBufferedImage(imageUrl);
            logger.debug("Image downloaded successfully, dimensions: {}x{}", 
                originalImage.getWidth(), originalImage.getHeight());

            // Apply OpenCV preprocessing for license documents
            logger.debug("Applying OpenCV preprocessing for license document");
            processedImage = preprocessLicenseDocument(originalImage);
            logger.debug("Preprocessing completed, new dimensions: {}x{}", 
                processedImage.getWidth(), processedImage.getHeight());

            // Configure Tesseract for documents
            configureTesseractForDocuments(tesseract);

            logger.info("Performing OCR on processed image");
            String extractedText;

            try {
                extractedText = tesseract.doOCR(processedImage);
            } catch (TesseractException e) {
                logger.warn("Primary OCR failed, retrying with alternative segmentation mode");
                // Retry with alternative segmentation
                tesseract.setPageSegMode(4);
                extractedText = tesseract.doOCR(processedImage);
                // Reset back to preferred mode
                tesseract.setPageSegMode(11);
            }

            logger.info("OCR completed, extracted text length: {}", extractedText.length());
            logger.info("=== RAW OCR TEXT START ===");
            logger.info("{}", extractedText);
            logger.info("=== RAW OCR TEXT END ===");

            // Try AI parsing first
            LicenseInfo result = parseWithAI(extractedText);
            if (result != null && result.isExtractionSuccessful()) {
                logger.info("AI extraction successful - License: {}, Type: {}, Expiry: {}, Name: {}, DOB: {}, Address: {}",
                    result.getLicenseNumber(), result.getLicenseType(), result.getExpiryDate(),
                    result.getFullName(), result.getDateOfBirth(), result.getAddress());
            } else {
                // Fallback to regex parsing
                logger.warn("AI parsing failed or returned no data, falling back to regex");
                result = parseLicenseInfo(extractedText);
                if (result.isExtractionSuccessful()) {
                    logger.info("Regex extraction successful - License: {}, Type: {}, Expiry: {}",
                        result.getLicenseNumber(), result.getLicenseType(), result.getExpiryDate());
                } else {
                    logger.warn("Regex extraction failed: {}", result.getErrorMessage());
                }
            }

            return result;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("Thread interrupted while waiting for Tesseract instance", e);
            return new LicenseInfo("OCR processing was interrupted");
        } catch (TesseractException e) {
            logger.error("Tesseract OCR processing failed for URL: {} - Error: {}", imageUrl, e.getMessage(), e);
            return new LicenseInfo("OCR processing failed: " + e.getMessage());
        } catch (IOException e) {
            logger.error("Image download/processing failed for URL: {} - Error: {}", imageUrl, e.getMessage(), e);
            return new LicenseInfo("Failed to download or process image: " + e.getMessage());
        } catch (Throwable e) {
            logger.error("Unexpected error during OCR processing for URL: {} - Error: {}", imageUrl, e.getMessage(), e);
            return new LicenseInfo("Unexpected error during OCR processing: " + e.getMessage());
        } finally {
            // Return Tesseract instance to pool
            if (tesseract != null) {
                tesseractPool.offer(tesseract);
            }
            
            // Clean up images
            if (originalImage != null) {
                originalImage.flush();
            }
            if (processedImage != null) {
                processedImage.flush();
            }
        }
    }

    private BufferedImage downloadImageAsBufferedImage(String imageUrl) throws IOException {
        byte[] imageBytes = downloadImage(imageUrl);
        if (imageBytes == null || imageBytes.length == 0) {
            throw new IOException("Failed to download image from URL: " + imageUrl);
        }

        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(imageBytes)) {
            BufferedImage image = ImageIO.read(bais);
            if (image == null) {
                throw new IOException("Failed to decode image format");
            }
            
            // Validate image size to prevent memory issues
            int maxPixels = 10_000_000; // 10 megapixels
            long pixels = (long) image.getWidth() * image.getHeight();
            if (pixels > maxPixels) {
                logger.warn("Image too large: {}x{} pixels, resizing", image.getWidth(), image.getHeight());
                image = resizeImage(image, 3000, 3000);
            }
            
            return image;
        }
    }

    private BufferedImage resizeImage(BufferedImage original, int maxWidth, int maxHeight) {
        int width = original.getWidth();
        int height = original.getHeight();
        
        double scale = Math.min((double) maxWidth / width, (double) maxHeight / height);
        
        if (scale >= 1) return original;
        
        int newWidth = (int) (width * scale);
        int newHeight = (int) (height * scale);
        
        BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        java.awt.Graphics2D g = resized.createGraphics();
        g.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, 
            java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(original, 0, 0, newWidth, newHeight, null);
        g.dispose();
        
        return resized;
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
            logger.error("Error downloading image: {}", e.getMessage(), e);
            return null;
        }
    }

    private BufferedImage preprocessLicenseDocument(BufferedImage originalImage) {
        Mat src = null;
        Mat gray = null;
        Mat cleaned = null;
        Mat sharpened = null;

        try {
            src = bufferedImageToMat(originalImage);
            gray = new Mat();

            // 1️⃣ Convert to grayscale
            Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY);

            // 2️⃣ Apply bilateral filter to reduce noise while keeping edges sharp
            cleaned = new Mat();
            Imgproc.bilateralFilter(gray, cleaned, 9, 75, 75);

            // 3️⃣ Apply unsharp masking to enhance text edges
            sharpened = new Mat();
            Imgproc.GaussianBlur(cleaned, sharpened, new Size(0, 0), 3);
            Core.addWeighted(cleaned, 1.5, sharpened, -0.5, 0, sharpened);

            // 4️⃣ Normalize the final result for better contrast
            Core.normalize(sharpened, sharpened, 0, 255, Core.NORM_MINMAX);

            return matToBufferedImage(sharpened);

        } catch (Exception e) {
            logger.error("Advanced preprocessing failed, trying basic preprocessing", e);
            // Fallback to basic preprocessing
            try {
                if (src == null) {
                    src = bufferedImageToMat(originalImage);
                }
                if (gray == null || gray.empty()) {
                    gray = new Mat();
                    Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY);
                }
                Core.normalize(gray, gray, 0, 255, Core.NORM_MINMAX);
                return matToBufferedImage(gray);
            } catch (Exception fallbackError) {
                logger.error("Basic preprocessing also failed, using original image", fallbackError);
                return originalImage;
            }
        } finally {
            // Clean up all Mats
            if (src != null) src.release();
            if (gray != null) gray.release();
            if (cleaned != null) cleaned.release();
            if (sharpened != null) sharpened.release();
        }
    }

    private void configureTesseractForDocuments(ITesseract tesseract) {
        // Best for IDs and cards - use PSM 6 (uniform block of text) for better mixed language support
        tesseract.setPageSegMode(6); // Uniform block of text
        tesseract.setOcrEngineMode(1); // LSTM

        // DO NOT rotate text
        tesseract.setTessVariable("textord_rotation", "0");

        // Let Tesseract decide characters
        tesseract.setTessVariable("preserve_interword_spaces", "1");

        // Improve line detection
        tesseract.setTessVariable("textord_min_linesize", "1.25");

        // Disable dictionary guessing (important for IDs with proper names)
        tesseract.setTessVariable("load_system_dawg", "0");
        tesseract.setTessVariable("load_freq_dawg", "0");

        // Enable better character recognition for mixed languages
        tesseract.setTessVariable("tessedit_char_whitelist",
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-.,:;()[]{}@#$%&*+=<>?\"' ");

        // Improve OCR accuracy for documents
        tesseract.setTessVariable("tessedit_pageseg_mode", "6");
        tesseract.setTessVariable("tessedit_ocr_engine_mode", "1");

        // Better handling of text with varying character sizes
        tesseract.setTessVariable("textord_tabfind_find_tables", "0");
        tesseract.setTessVariable("textord_tablefind_recognize_tables", "0");

        // Improve recognition of connected text
        tesseract.setTessVariable("tessedit_write_images", "0");
        tesseract.setTessVariable("tessedit_create_hocr", "0");
    }

    private Mat bufferedImageToMat(BufferedImage bi) {
        Mat mat = null;
        try {
            BufferedImage convertedImage = new BufferedImage(
                bi.getWidth(), bi.getHeight(), BufferedImage.TYPE_3BYTE_BGR);
            convertedImage.getGraphics().drawImage(bi, 0, 0, null);
            
            mat = new Mat(convertedImage.getHeight(), convertedImage.getWidth(), CvType.CV_8UC3);
            byte[] data = ((java.awt.image.DataBufferByte) convertedImage.getRaster().getDataBuffer()).getData();
            mat.put(0, 0, data);
            return mat;
        } catch (Exception e) {
            if (mat != null) mat.release();
            logger.error("Error converting BufferedImage to Mat: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to convert image format for OpenCV processing", e);
        }
    }

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

    private LicenseInfo parseLicenseInfo(String text) {
        // Your existing implementation
        if (text == null || text.trim().isEmpty()) {
            return new LicenseInfo("No text extracted from image");
        }

        logger.debug("Extracted OCR text: {}", text);

        String licenseNumber = extractLicenseNumber(text);
        String licenseType = extractLicenseType(text);
        String expiryDate = extractExpiryDate(text);
        String licenseIssueDate = extractLicenseIssueDate(text);
        String fullName = extractFullName(text);
        String dateOfBirth = extractDateOfBirth(text);
        String address = extractAddress(text);

        boolean hasPartialData = licenseNumber != null || licenseType != null || expiryDate != null ||
                                licenseIssueDate != null || fullName != null || dateOfBirth != null || address != null;
        
        if (hasPartialData) {
            logger.info("OCR extracted partial data - License: {}, Type: {}, Expiry: {}, Name: {}, DOB: {}, Address: {}",
                licenseNumber, licenseType, expiryDate, fullName, dateOfBirth, address);
            return new LicenseInfo(licenseNumber, licenseType, expiryDate, licenseIssueDate, fullName, dateOfBirth, address);
        } else {
            logger.warn("OCR could not extract any license information from text");
            return new LicenseInfo("Could not extract license information. Image may be unclear or text not recognizable.");
        }
    }

    private String extractLicenseNumber(String text) {
        // More comprehensive patterns for license numbers including USA and Vietnamese formats
        Pattern[] patterns = {
            // USA DLN/DL patterns
            Pattern.compile("(?i)(?:dln|dl|license\\s*number|#)[:\\s]*([A-Z0-9\\s]{4,20})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i)(?:driver'?s?\\s*license|dl)[:\\s]*([A-Z0-9\\s]{4,20})", Pattern.CASE_INSENSITIVE),
            
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
        // Expanded license types including USA and Vietnamese categories
        String[][] types = {
            // USA/International/Commercial
            {"CLASS A", "CLASS B", "CLASS C", "CLASS D", "CLASS E", "CDL", "COMMERCIAL"},
            // Vietnamese license types
            {"A1", "A2", "A3", "A4", "B1", "B2", "C", "D", "E", "F", "FB", "FC", "FD"},
            // Common descriptors
            {"MOTORCYCLE", "CAR", "TRUCK", "BUS", "HEAVY", "LIGHT", "TEMPORARY"}
        };
        
        String upperText = text.toUpperCase();

        // First check for USA CLASS pattern
        Pattern classPattern = Pattern.compile("(?i)class[:\\s]*([A-Z])");
        Matcher matcher = classPattern.matcher(text);
        if (matcher.find()) {
            String result = "CLASS " + matcher.group(1).toUpperCase();
            logger.debug("Found USA class license type: {}", result);
            return result;
        }

        // Then check for Vietnamese patterns (more specific)
        for (String type : types[1]) {
            if (upperText.contains(" " + type + " ") || upperText.contains(type + " ") || upperText.contains(" " + type)) {
                logger.debug("Found Vietnamese license type: {}", type);
                return type;
            }
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
        // Enhanced date patterns including USA and Vietnamese formats
        Pattern[] datePatterns = {
            // USA EXP pattern
            Pattern.compile("(?i)exp(?:iry)?[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            
            // Standard expiry patterns
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

    private String extractFullName(String text) {
        // Patterns for full name extraction, including USA formats
        Pattern[] patterns = {
            Pattern.compile("(?i)(?:name|full\\s*name)[:\\s]*([A-Z\\s,]{3,50})"),
            // USA format: LAST, FIRST MIDDLE
            Pattern.compile("([A-Z]+,\\s*[A-Z]+(?:\\s*[A-Z]+)?)"),
            // USA format: FIRST MIDDLE LAST
            Pattern.compile("\\b([A-Z][a-z]+\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\b"),
            // Common name pattern
            Pattern.compile("\\b([A-Z][a-z]+\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\b")
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String result = matcher.group(1).trim();
                if (result.length() >= 3) {
                    logger.debug("Found full name: {}", result);
                    return result;
                }
            }
        }
        return null;
    }

    private String extractDateOfBirth(String text) {
        // DOB patterns, including USA formats
        Pattern[] patterns = {
            Pattern.compile("(?i)dob[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            Pattern.compile("(?i)date\\s*of\\s*birth[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            Pattern.compile("(?i)birth(?:\\s*date)?[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})")
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String dateStr = matcher.group(1);
                if (isValidDate(dateStr)) {
                    String result = formatDate(dateStr);
                    logger.debug("Found date of birth: {} -> {}", dateStr, result);
                    return result;
                }
            }
        }
        return null;
    }

    private String extractLicenseIssueDate(String text) {
        // Issue date patterns - similar to expiry but with different keywords
        Pattern[] patterns = {
            // Issue date patterns
            Pattern.compile("(?i)issue(?:d)?[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            Pattern.compile("(?i)issued[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            Pattern.compile("(?i)valid\\s*from[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),
            Pattern.compile("(?i)date\\s*issued[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})"),

            // Vietnamese patterns
            Pattern.compile("(?i)ngày\\s*cấp[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})"),
            Pattern.compile("(?i)cấp\\s*ngày[:\\s]*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})")
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String dateStr = matcher.group(1);
                if (isValidDate(dateStr)) {
                    String result = formatDate(dateStr);
                    logger.debug("Found license issue date: {} -> {}", dateStr, result);
                    return result;
                }
            }
        }
        return null;
    }

    private String extractAddress(String text) {
        // Address patterns, including USA formats
        Pattern[] patterns = {
            Pattern.compile("(?i)address[:\\s]*([\\w\\s,.-]{10,100})"),
            // USA address format: 123 MAIN ST CITY, ST 12345
            Pattern.compile("(\\d+\\s+[A-Z\\s]+,\\s*[A-Z]{2}\\s+\\d{5})")
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String result = matcher.group(1).trim();
                if (result.length() >= 10) {
                    logger.debug("Found address: {}", result);
                    return result;
                }
            }
        }
        return null;
    }

    private LicenseInfo parseWithAI(String rawText) {
        try {
            String prompt = "You are an expert at parsing Vietnamese and international driver's license information from OCR text that may contain character recognition errors. Analyze this raw OCR text carefully and extract the driver's license details.\n\n" +
                           "IMPORTANT CONTEXT: OCR often makes mistakes with accented characters, so:\n" +
                           "- 'Hồ Chí Minh' might appear as 'Ho Chi Minh', 'Hé Ch Minh', or similar\n" +
                           "- Vietnamese names like 'Nguyễn' might appear as 'Nguyen', 'Nguyén', etc.\n" +
                           "- 'Dương Hồng Thanh' might appear as 'Duong Hong Thanh', 'GHONG THANH', etc.\n" +
                           "- Look for phonetic similarities and context clues\n\n" +
                           "KEY PATTERNS TO LOOK FOR:\n" +
                           "- License numbers: Format like '790130000208', '30A-12345', 'XE7105'\n" +
                           "- Full names: Korean names like 'KWAK JUSEOP', Vietnamese names with accents\n" +
                           "- License types: A1, A2, A3, A4, B1, B2, C, D, E, F, FB, FC, FD or Class A/B/C/D/E\n" +
                           "- Dates: Look for birth dates (DOB) and expiry dates. Common formats: DD/MM/YYYY, 25/03/1955, 05/07/2015\n" +
                           "- Addresses: Vietnamese addresses containing 'Hồ Chí Minh', 'TP.HCM', districts like 'Q.1', wards like 'P. Đa Kao'\n\n" +
                           "EXTRACTION STRATEGY:\n" +
                           "1. Look for complete information first\n" +
                           "2. If OCR corrupted text, use context and patterns to reconstruct\n" +
                           "3. For names: If you see 'KWAK JUSEOP', that's likely correct\n" +
                           "4. For addresses: '162 Nguyen Van Thu P. Da Kao, Q.1, TP. Ho Chi Minh' → reconstruct as proper Vietnamese\n" +
                           "5. For corrupted signatures: Look for patterns that might be 'DUONG HONG THANH'\n\n" +
                           "Extract into this exact JSON format:\n" +
                           "{\n" +
                           "  \"full_name\": \"corrected full name or null\",\n" +
                           "  \"license_number\": \"license number or null\",\n" +
                           "  \"license_type\": \"license type or null\",\n" +
                           "  \"expiry_date\": \"full date in YYYY-MM-DD format or null\",\n" +
                           "  \"issue_date\": \"full date in YYYY-MM-DD format or null\",\n" +
                           "  \"date_of_birth\": \"full date in YYYY-MM-DD format or null\",\n" +
                           "  \"address\": \"corrected full address or null\"\n" +
                           "}\n\n" +
                           "Be intelligent about OCR errors - use context to reconstruct missing accents and corrupted text.\n\n" +
                           "Raw OCR text to analyze:\n" + rawText + "\n\n" +
                           "Return ONLY the JSON object, nothing else.";

        String aiResponse = geminiChatModel.call(prompt);

            logger.debug("AI response: {}", aiResponse);

            // Clean up the response - remove markdown formatting if present
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

            // Parse JSON response
            var jsonNode = objectMapper.readTree(cleanJson);
            String fullName = jsonNode.get("full_name").asText(null);
            String licenseNumber = jsonNode.get("license_number").asText(null);
            String licenseType = jsonNode.get("license_type").asText(null);
            String expiryDate = jsonNode.get("expiry_date").asText(null);
            String issueDate = jsonNode.get("issue_date").asText(null);
            String dateOfBirth = jsonNode.get("date_of_birth").asText(null);
            String address = jsonNode.get("address").asText(null);

            return new LicenseInfo(licenseNumber, licenseType, expiryDate, issueDate, fullName, dateOfBirth, address);
        } catch (Exception e) {
            logger.error("AI parsing failed: {}", e.getMessage(), e);
            return null;
        }
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

    public LicenseInfo extractLicenseInfoFromUrl(String imageUrl) {
        return extractLicenseInfo(imageUrl);
    }
}

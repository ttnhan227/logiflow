package com.logiflow.server.services.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PayPalServiceImpl implements PayPalService {

    private static final Logger logger = LoggerFactory.getLogger(PayPalServiceImpl.class);

    @Value("${paypal.mode}")
    private String paypalMode;

    @Value("${paypal.client.id}")
    private String clientId;

    @Value("${paypal.client.secret}")
    private String clientSecret;

    @Value("${paypal.return.url}")
    private String returnUrl;

    @Value("${paypal.cancel.url}")
    private String cancelUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getBaseUrl() {
        return "sandbox".equals(paypalMode)
            ? "https://api-m.sandbox.paypal.com"
            : "https://api-m.paypal.com";
    }

    /**
     * Get PayPal access token
     */
    private String getAccessToken() {
        String url = getBaseUrl() + "/v1/oauth2/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(clientId, clientSecret);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return (String) response.getBody().get("access_token");
        }

        throw new RuntimeException("Failed to obtain PayPal access token");
    }

    /**
     * Create PayPal payment order
     */
    public Map<String, Object> createPaymentOrder(BigDecimal amount, String currency, String description) {
        try {
            String accessToken = getAccessToken();
            String url = getBaseUrl() + "/v2/checkout/orders";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("intent", "CAPTURE");

            Map<String, Object> amountMap = new HashMap<>();
            amountMap.put("currency_code", currency);
            amountMap.put("value", amount.toString());

            Map<String, Object> purchaseUnit = new HashMap<>();
            purchaseUnit.put("reference_id", "LOGIFLOW-" + System.currentTimeMillis());
            purchaseUnit.put("description", description);
            purchaseUnit.put("amount", amountMap);

            Map<String, Object> applicationContext = new HashMap<>();
            applicationContext.put("return_url", returnUrl);
            applicationContext.put("cancel_url", cancelUrl);
            applicationContext.put("brand_name", "LogiFlow");
            applicationContext.put("landing_page", "BILLING");
            applicationContext.put("user_action", "PAY_NOW");

            requestBody.put("purchase_units", new Object[]{purchaseUnit});
            requestBody.put("application_context", applicationContext);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                return response.getBody();
            }

            throw new RuntimeException("Failed to create PayPal payment order");
        } catch (Exception e) {
            logger.error("Failed to create PayPal payment order for amount {} and description '{}': {}", amount, description, e.getMessage(), e);
            throw new RuntimeException("Payment order creation failed. Please try again later.");
        }
    }

    /**
     * Capture payment for an approved order
     */
    public Map<String, Object> capturePayment(String orderId) {
        try {
            String accessToken = getAccessToken();
            String url = getBaseUrl() + "/v2/checkout/orders/" + orderId + "/capture";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>("{}", headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                return response.getBody();
            }

            throw new RuntimeException("Failed to capture PayPal payment");
        } catch (Exception e) {
            logger.error("Failed to capture PayPal payment for order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Payment capture failed. Please contact support if the issue persists.");
        }
    }

    /**
     * Get payment details
     */
    public Map<String, Object> getPaymentDetails(String orderId) {
        try {
            String accessToken = getAccessToken();
            String url = getBaseUrl() + "/v2/checkout/orders/" + orderId;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }

            throw new RuntimeException("Failed to get PayPal payment details");
        } catch (Exception e) {
            logger.error("Failed to get PayPal payment details for order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Payment details retrieval failed. Please contact support if the issue persists.");
        }
    }

    /**
     * Generate PayPal payment link for customer
     */
    public String generatePaymentLink(BigDecimal amount, String currency, String description) {
        Map<String, Object> paymentOrder = createPaymentOrder(amount, currency, description);

        if (paymentOrder.containsKey("links")) {
            @SuppressWarnings("unchecked")
            java.util.List<Object> links = (java.util.List<Object>) paymentOrder.get("links");
            if (links != null) {
                for (Object linkObj : links) {
                    Map<String, Object> link = (Map<String, Object>) linkObj;
                    if ("approve".equals(link.get("rel"))) {
                        return (String) link.get("href");
                    }
                }
            }
        }

        throw new RuntimeException("Failed to generate PayPal payment link");
    }

    /**
     * Extract transaction ID from captured payment response
     */
    public String extractTransactionId(Map<String, Object> captureResponse) {
        try {
            if (captureResponse.containsKey("purchase_units")) {
                @SuppressWarnings("unchecked")
                java.util.List<Object> purchaseUnits = (java.util.List<Object>) captureResponse.get("purchase_units");
                if (purchaseUnits != null && !purchaseUnits.isEmpty()) {
                    Map<String, Object> purchaseUnit = (Map<String, Object>) purchaseUnits.get(0);
                    if (purchaseUnit.containsKey("payments")) {
                        Map<String, Object> payments = (Map<String, Object>) purchaseUnit.get("payments");
                        if (payments.containsKey("captures")) {
                            @SuppressWarnings("unchecked")
                            java.util.List<Object> captures = (java.util.List<Object>) payments.get("captures");
                            if (captures != null && !captures.isEmpty()) {
                                Map<String, Object> capture = (Map<String, Object>) captures.get(0);
                                return (String) capture.get("id");
                            }
                        }
                    }
                }
            }
            return null;
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract transaction ID: " + e.getMessage());
        }
    }
}

package com.logiflow.server.services.payment;

import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.logiflow.server.models.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Base64;

@Service
public class InvoicePdfService {

    private final TemplateEngine templateEngine;

    public InvoicePdfService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public byte[] generateInvoice(Order order) {
        Context context = new Context();
        context.setVariable("order", order);
        context.setVariable("date", LocalDate.now());

        // Load and encode logo image as base64
        try {
            ClassPathResource logoResource = new ClassPathResource("static/images/logiflow-smarter_logistics-seamless_flow.png");
            if (logoResource.exists()) {
                byte[] logoBytes = logoResource.getInputStream().readAllBytes();
                String logoBase64 = Base64.getEncoder().encodeToString(logoBytes);
                context.setVariable("logoBase64", "data:image/png;base64," + logoBase64);
            } else {
                // Fallback if logo not found
                context.setVariable("logoBase64", "");
            }
        } catch (IOException e) {
            // Fallback if logo loading fails
            context.setVariable("logoBase64", "");
        }

        // Format shipping fee with commas and USD equivalent
        String shippingFeeFormatted = order.getShippingFee() != null
            ? String.format("%,.0f", order.getShippingFee())
            : "0";

        // Calculate USD equivalent (approximate rate: 1 USD = 23,000 VND)
        String usdEquivalent = "";
        if (order.getShippingFee() != null) {
            double usdAmount = order.getShippingFee().doubleValue() / 23000.0;
            usdEquivalent = String.format(" ($%.2f)", usdAmount);
        }

        // Format package value with commas
        String packageValueFormatted = "";
        if (order.getPackageValue() != null) {
            packageValueFormatted = String.format("%,.0f VND", order.getPackageValue());
        }

        context.setVariable("shippingFeeFormatted", shippingFeeFormatted);
        context.setVariable("usdEquivalent", usdEquivalent);
        context.setVariable("packageValueFormatted", packageValueFormatted);

        String html = templateEngine.process("invoice", context);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ConverterProperties converterProperties = new ConverterProperties();

            // No baseUri needed since we're using embedded base64 images
            HtmlConverter.convertToPdf(html, out, converterProperties);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate invoice PDF", e);
        }
    }
}

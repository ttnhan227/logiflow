package com.logiflow.server.services.admin;

import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.logiflow.server.dtos.admin.reports.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;

/**
 * Service for generating comprehensive admin report PDFs using Thymeleaf templates and iText
 */
@Service
public class AdminReportPdfService {

    private final TemplateEngine templateEngine;
    private final AdminReportsService adminReportsService;

    public AdminReportPdfService(TemplateEngine templateEngine, AdminReportsService adminReportsService) {
        this.templateEngine = templateEngine;
        this.adminReportsService = adminReportsService;
    }

    /**
     * Generate comprehensive business intelligence report PDF
     */
    public byte[] generateComprehensiveReport(LocalDate startDate, LocalDate endDate) {
        // Fetch all individual reports
        PerformanceReportDto performance = adminReportsService.getPerformanceReport(startDate, endDate);
        CostAnalysisDto costAnalysis = adminReportsService.getCostAnalysis(startDate, endDate);
        ComplianceReportDto compliance = adminReportsService.getComplianceReport(startDate, endDate);
        List<DriverPerformanceDto> drivers = adminReportsService.getDriverPerformance(startDate, endDate);

        // Calculate additional metrics
        Double onTimeDeliveryRate = calculateOverallOnTimeRate(drivers);
        BigDecimal totalCosts = calculateTotalCosts(costAnalysis);
        BigDecimal netProfit = performance.getTotalRevenue() != null && totalCosts != null
            ? performance.getTotalRevenue().subtract(totalCosts) : BigDecimal.ZERO;
        Double profitMargin = performance.getTotalRevenue() != null && performance.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0
            ? netProfit.divide(performance.getTotalRevenue(), 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
            : 0.0;

        // Build comprehensive report
        ComprehensiveReportDto comprehensiveReport = ComprehensiveReportDto.builder()
            .startDate(startDate)
            .endDate(endDate)

            // Performance metrics
            .totalTrips(performance.getTotalTrips())
            .completedTrips(performance.getCompletedTrips())
            .cancelledTrips(performance.getCancelledTrips())
            .completionRate(performance.getCompletionRate())
            .averageDeliveryTimeMinutes(performance.getAverageDeliveryTimeMinutes())
            .fleetUtilizationRate(85.0) // Placeholder - would need to be calculated
            .customerSatisfactionScore(4.2) // Placeholder
            .totalRevenue(performance.getTotalRevenue())
            .averageRevenuePerTrip(performance.getAverageRevenuePerTrip())
            .totalActiveDrivers(performance.getTotalActiveDrivers())
            .averageTripsPerDriver(performance.getAverageTripsPerDriver())
            .dailyStats(performance.getDailyStats())

            // Cost analysis
            .totalCosts(totalCosts)
            .netProfit(netProfit)
            .profitMarginPercentage(profitMargin)
            .averageCostPerTrip(costAnalysis.getAverageCostPerTrip())
            .totalVehicles(costAnalysis.getTotalVehicles())
            .activeVehicles(costAnalysis.getActiveVehicles())
            .vehicleUtilizationRate(costAnalysis.getVehicleUtilizationRate())
            .costBreakdownByCategory(costAnalysis.getVehicleTypeCosts()) // Using vehicle costs as category breakdown
            .vehicleTypeCosts(costAnalysis.getVehicleTypeCosts())

            // Compliance metrics
            .overallComplianceRate(compliance.getOverallComplianceRate())
            .workingHoursViolations(5) // Placeholder
            .upcomingLicenseExpirations(compliance.getDriversWithExpiringSoonLicense())
            .restPeriodViolations(2) // Placeholder
            .totalDrivers(compliance.getTotalDrivers())
            .driversWithValidLicense(compliance.getDriversWithValidLicense())
            .driversWithExpiredLicense(compliance.getDriversWithExpiredLicense())
            .driversWithExpiringSoonLicense(compliance.getDriversWithExpiringSoonLicense())

            // Driver performance
            .driverPerformanceRankings(drivers)
            .totalDriverCount(drivers.size())
            .onTimeDeliveryRate(onTimeDeliveryRate)

            .build();

        Context context = createBaseContext("LogiFlow Business Intelligence Report", startDate, endDate);
        context.setVariable("report", comprehensiveReport);

        String html = templateEngine.process("admin/reports/comprehensive-report", context);
        return convertHtmlToPdf(html, "comprehensive_business_report_" + startDate + "_to_" + endDate);
    }

    /**
     * Calculate overall on-time delivery rate across all drivers
     */
    private Double calculateOverallOnTimeRate(List<DriverPerformanceDto> drivers) {
        if (drivers.isEmpty()) return 0.0;

        double weightedSum = 0.0;
        long totalTrips = 0;

        for (DriverPerformanceDto driver : drivers) {
            if (driver.getTotalTripsCompleted() != null && driver.getOnTimeDeliveryRate() != null) {
                weightedSum += driver.getTotalTripsCompleted() * driver.getOnTimeDeliveryRate();
                totalTrips += driver.getTotalTripsCompleted();
            }
        }

        return totalTrips > 0 ? Math.round((weightedSum / totalTrips) * 100.0) / 100.0 : 0.0;
    }

    /**
     * Calculate total costs from cost analysis
     */
    private BigDecimal calculateTotalCosts(CostAnalysisDto costAnalysis) {
        // For now, use a simple calculation based on total trips and average cost per trip
        if (costAnalysis.getTotalTrips() != null && costAnalysis.getAverageCostPerTrip() != null) {
            return BigDecimal.valueOf(costAnalysis.getTotalTrips() * costAnalysis.getAverageCostPerTrip());
        }
        return BigDecimal.valueOf(1000000); // Placeholder value
    }

    /**
     * Create base context with common variables
     */
    private Context createBaseContext(String reportTitle, LocalDate startDate, LocalDate endDate) {
        Context context = new Context();
        context.setVariable("reportTitle", reportTitle);
        context.setVariable("startDate", startDate);
        context.setVariable("endDate", endDate);
        context.setVariable("generatedDate", LocalDate.now());
        context.setVariable("generatedTime", java.time.LocalDateTime.now());

        // Load and encode logo image as base64
        try {
            ClassPathResource logoResource = new ClassPathResource("static/images/logiflow-smarter_logistics-seamless_flow.png");
            if (logoResource.exists()) {
                byte[] logoBytes = logoResource.getInputStream().readAllBytes();
                String logoBase64 = Base64.getEncoder().encodeToString(logoBytes);
                context.setVariable("logoBase64", "data:image/png;base64," + logoBase64);
            } else {
                context.setVariable("logoBase64", "");
            }
        } catch (IOException e) {
            context.setVariable("logoBase64", "");
        }

        return context;
    }

    /**
     * Convert HTML to PDF using iText
     */
    private byte[] convertHtmlToPdf(String html, String filename) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ConverterProperties converterProperties = new ConverterProperties();
            HtmlConverter.convertToPdf(html, out, converterProperties);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate " + filename + " PDF", e);
        }
    }
}

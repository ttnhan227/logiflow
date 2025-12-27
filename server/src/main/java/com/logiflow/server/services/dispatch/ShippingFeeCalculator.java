package com.logiflow.server.services.dispatch;

import com.logiflow.server.models.Order;
import com.logiflow.server.services.admin.SystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Service to calculate shipping fee based on distance, weight, and package value
 * Now uses configurable system settings instead of hardcoded values
 */
@Component
public class ShippingFeeCalculator {

    @Autowired
    private SystemSettingsService systemSettingsService;

    // Default fallback values (used if system settings are not configured)
    private static final BigDecimal DEFAULT_BASE_FEE = new BigDecimal("20");
    private static final BigDecimal DEFAULT_PRICE_PER_KM = new BigDecimal("5");
    private static final BigDecimal DEFAULT_PRICE_PER_TON = new BigDecimal("50000");
    private static final BigDecimal DEFAULT_INSURANCE_RATE = new BigDecimal("0.01"); // 1% of package value
    private static final BigDecimal DEFAULT_URGENT_MULTIPLIER = new BigDecimal("1.5"); // 50% extra
    private static final BigDecimal DEFAULT_MIN_FEE = new BigDecimal("10");

    /**
     * Calculate shipping fee based on distance, weight, package value, and priority
     *
     * Formula:
     * - Base fee: 20 usd
     * - Distance fee: distance (km) * 5 usd/km
     * - Weight fee: weight (tons) * 50000 usd/ton
     * - Insurance fee: package value * 1%
     * - Priority multiplier: URGENT orders get 1.5x multiplier
     * - Minimum fee: 10 usd
     *
     * @param distanceKm Distance in toones (can be null)
     * @param weightTons Weight in tons (can be null)
     * @param packageValue Package value in VND (can be null)
     * @param priorityLevel Priority level (NORMAL or URGENT)
     * @return Calculated shipping fee in VND
     */
    public BigDecimal calculateShippingFee(
            BigDecimal distanceKm,
            BigDecimal weightTons,
            BigDecimal packageValue,
            Order.PriorityLevel priorityLevel) {

        // Get pricing settings from system configuration
        BigDecimal baseFee = getSystemSettingAsBigDecimal("pricing", "base_fee", DEFAULT_BASE_FEE);
        BigDecimal pricePerKm = getSystemSettingAsBigDecimal("pricing", "price_per_km", DEFAULT_PRICE_PER_KM);
        BigDecimal pricePerTon = getSystemSettingAsBigDecimal("pricing", "price_per_ton", DEFAULT_PRICE_PER_TON);
        BigDecimal insuranceRate = getSystemSettingAsBigDecimal("pricing", "insurance_rate", DEFAULT_INSURANCE_RATE);
        BigDecimal urgentMultiplier = getSystemSettingAsBigDecimal("pricing", "urgent_multiplier", DEFAULT_URGENT_MULTIPLIER);
        BigDecimal minFee = getSystemSettingAsBigDecimal("pricing", "min_fee", DEFAULT_MIN_FEE);

        BigDecimal totalFee = baseFee;

        // Distance fee
        if (distanceKm != null && distanceKm.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal distanceFee = distanceKm.multiply(pricePerKm);
            totalFee = totalFee.add(distanceFee);
        }

        // Weight fee
        if (weightTons != null && weightTons.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal weightFee = weightTons.multiply(pricePerTon);
            totalFee = totalFee.add(weightFee);
        }

        // Insurance fee (based on package value)
        if (packageValue != null && packageValue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal insuranceFee = packageValue.multiply(insuranceRate);
            totalFee = totalFee.add(insuranceFee);
        }

        // Priority multiplier (URGENT orders cost more)
        if (priorityLevel == Order.PriorityLevel.URGENT) {
            totalFee = totalFee.multiply(urgentMultiplier);
        }

        // Ensure minimum fee
        if (totalFee.compareTo(minFee) < 0) {
            totalFee = minFee;
        }

        return totalFee.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal getSystemSettingAsBigDecimal(String category, String key, BigDecimal defaultValue) {
        try {
            Optional<String> value = systemSettingsService.getSettingValue(category, key);
            if (value.isPresent()) {
                return new BigDecimal(value.get());
            }
            return defaultValue;
        } catch (Exception e) {
            System.out.println("Error retrieving system setting " + category + "." + key + ": " + e.getMessage());
            return defaultValue;
        }
    }
}

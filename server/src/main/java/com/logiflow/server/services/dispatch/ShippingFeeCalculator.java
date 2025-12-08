package com.logiflow.server.services.dispatch;

import com.logiflow.server.models.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Service to calculate shipping fee based on distance, weight, and package value
 */
@Component
public class ShippingFeeCalculator {

    // Pricing constants (có thể move vào config file sau)
    private static final BigDecimal BASE_FEE = new BigDecimal("20");
    private static final BigDecimal PRICE_PER_KM = new BigDecimal("5");
    private static final BigDecimal PRICE_PER_KG = new BigDecimal("50");
    private static final BigDecimal INSURANCE_RATE = new BigDecimal("0.01"); // 1% of package value for insurance
    private static final BigDecimal URGENT_FEE_MULTIPLIER = new BigDecimal("1.5"); // 50% extra for urgent orders
    private static final BigDecimal MIN_FEE = new BigDecimal("10"); // Minimum fee 10usd

    /**
     * Calculate shipping fee based on distance, weight, package value, and priority
     * 
     * Formula:
     * - Base fee: 20 usd
     * - Distance fee: distance (km) * 5 usd/km
     * - Weight fee: weight (kg) * 50usd/kg
     * - Insurance fee: package value * 1%
     * - Priority multiplier: URGENT orders get 1.5x multiplier
     * - Minimum fee: 10 usd
     * 
     * @param distanceKm Distance in kilometers (can be null)
     * @param weightKg Weight in kilograms (can be null)
     * @param packageValue Package value in VND (can be null)
     * @param priorityLevel Priority level (NORMAL or URGENT)
     * @return Calculated shipping fee in VND
     */
    public BigDecimal calculateShippingFee(
            BigDecimal distanceKm,
            BigDecimal weightKg,
            BigDecimal packageValue,
            Order.PriorityLevel priorityLevel) {
        
        BigDecimal totalFee = BASE_FEE;

        // Distance fee
        if (distanceKm != null && distanceKm.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal distanceFee = distanceKm.multiply(PRICE_PER_KM);
            totalFee = totalFee.add(distanceFee);
        }

        // Weight fee
        if (weightKg != null && weightKg.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal weightFee = weightKg.multiply(PRICE_PER_KG);
            totalFee = totalFee.add(weightFee);
        }

        // Insurance fee (based on package value)
        if (packageValue != null && packageValue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal insuranceFee = packageValue.multiply(INSURANCE_RATE);
            totalFee = totalFee.add(insuranceFee);
        }

        // Priority multiplier (URGENT orders cost 50% more)
        if (priorityLevel == Order.PriorityLevel.URGENT) {
            totalFee = totalFee.multiply(URGENT_FEE_MULTIPLIER);
        }

        if (totalFee.compareTo(MIN_FEE) < 0) {
            totalFee = MIN_FEE;
        }

        return totalFee.setScale(2, RoundingMode.HALF_UP);
    }
}


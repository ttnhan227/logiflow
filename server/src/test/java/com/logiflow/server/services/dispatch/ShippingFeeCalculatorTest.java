package com.logiflow.server.services.dispatch;

import com.logiflow.server.models.Order;
import com.logiflow.server.services.admin.SystemSettingsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShippingFeeCalculatorTest {

    @Mock
    private SystemSettingsService systemSettingsService;

    @InjectMocks
    private ShippingFeeCalculator shippingFeeCalculator;

    @Test
    @DisplayName("Calculates default shipping fee correctly for normal priority")
    void testStandardCalculation() {
        // Default settings: Base=20, PricePerKm=5, PricePerTon=50000, Insurance=1%, Min=10
        when(systemSettingsService.getSettingValue(anyString(), anyString())).thenReturn(Optional.empty());

        BigDecimal distance = new BigDecimal("10.0"); // 10 km * 5 = 50
        BigDecimal weight = new BigDecimal("0.5");     // 0.5 ton * 50,000 = 25,000
        BigDecimal packageValue = new BigDecimal("1000000"); // 1,000,000 * 1% = 10,000
        // Expected total = Base(20) + 50 + 25000 + 10000 = 35070.00

        BigDecimal fee = shippingFeeCalculator.calculateShippingFee(
                distance, weight, packageValue, Order.PriorityLevel.NORMAL);

        assertEquals(new BigDecimal("35070.00"), fee);
    }

    @Test
    @DisplayName("Applies 1.5x urgent priority multiplier correctly")
    void testUrgentMultiplier() {
        when(systemSettingsService.getSettingValue(anyString(), anyString())).thenReturn(Optional.empty());

        BigDecimal distance = new BigDecimal("20.0"); // 20 * 5 = 100
        BigDecimal weight = BigDecimal.ZERO;
        BigDecimal packageValue = BigDecimal.ZERO;
        // Subtotal = Base(20) + 100 = 120
        // Urgent 1.5x = 180.00

        BigDecimal fee = shippingFeeCalculator.calculateShippingFee(
                distance, weight, packageValue, Order.PriorityLevel.URGENT);

        assertEquals(new BigDecimal("180.00"), fee);
    }

    @Test
    @DisplayName("Enforces minimum fee threshold when calculated fee is lower")
    void testMinimumFeeFloor() {
        when(systemSettingsService.getSettingValue(anyString(), anyString())).thenReturn(Optional.empty());

        // Zero distance, zero weight, zero package value, but base fee is 20, min fee is 10.
        // Let's test custom settings where base is 5 and min fee is 25:
        when(systemSettingsService.getSettingValue("pricing", "base_fee")).thenReturn(Optional.of("5"));
        when(systemSettingsService.getSettingValue("pricing", "min_fee")).thenReturn(Optional.of("25"));

        BigDecimal fee = shippingFeeCalculator.calculateShippingFee(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, Order.PriorityLevel.NORMAL);

        assertEquals(new BigDecimal("25.00"), fee);
    }

    @Test
    @DisplayName("Gracefully handles null parameters and defaults to base fee")
    void testNullParametersHandledGracefully() {
        when(systemSettingsService.getSettingValue(anyString(), anyString())).thenReturn(Optional.empty());

        BigDecimal fee = shippingFeeCalculator.calculateShippingFee(
                null, null, null, null);

        // Default base fee is 20
        assertEquals(new BigDecimal("20.00"), fee);
    }
}

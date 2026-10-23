package com.logiflow.server.services.dispatch;

import com.logiflow.server.exceptions.BusinessRuleException;
import com.logiflow.server.models.Driver;
import com.logiflow.server.models.Order;
import com.logiflow.server.models.Trip;
import com.logiflow.server.models.Vehicle;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.trip_assignment.TripAssignmentRepository;
import com.logiflow.server.repositories.vehicle.VehicleRepository;
import com.logiflow.server.services.maps.MapsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripAssignmentMatchingServiceTest {

    @Mock private TripRepository tripRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private TripAssignmentRepository tripAssignmentRepository;
    @Mock private DriverWorkLogRepository driverWorkLogRepository;
    @Mock private MapsService mapsService;

    @InjectMocks
    private TripAssignmentMatchingServiceImpl matchingService;

    private Trip testTrip;
    private Vehicle testVehicle;
    private Driver testDriver;

    @BeforeEach
    void setUp() {
        testVehicle = new Vehicle();
        testVehicle.setVehicleId(1);
        testVehicle.setCapacityTons(new BigDecimal("20.0"));
        testVehicle.setRequiredLicense("FC");

        testTrip = new Trip();
        testTrip.setTripId(10);
        testTrip.setVehicle(testVehicle);
        testTrip.setScheduledDeparture(LocalDateTime.now().plusHours(3));

        testDriver = new Driver();
        testDriver.setDriverId(5);
        testDriver.setStatus("available");
        testDriver.setLicenseType("FC");
    }

    @Test
    @DisplayName("validateAssignment rejects driver when status is not available")
    void testRejectsUnavailableDriver() {
        testDriver.setStatus("off_duty");

        when(tripRepository.findByIdWithRelations(10)).thenReturn(Optional.of(testTrip));
        when(driverRepository.findById(5)).thenReturn(Optional.of(testDriver));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                matchingService.validateAssignment(10, 5, null));
        assertTrue(ex.getMessage().contains("Driver is not available"));
    }

    @Test
    @DisplayName("validateAssignment rejects driver when driver already has an active assignment (double-booking guard)")
    void testRejectsDoubleBookingActiveDriver() {
        when(tripRepository.findByIdWithRelations(10)).thenReturn(Optional.of(testTrip));
        when(driverRepository.findById(5)).thenReturn(Optional.of(testDriver));
        when(tripAssignmentRepository.countActiveAssignmentsByDriverId(5)).thenReturn(1L);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                matchingService.validateAssignment(10, 5, null));
        assertTrue(ex.getMessage().contains("already has an active trip assignment"));
    }

    @Test
    @DisplayName("validateAssignment rejects driver when license does not match vehicle requirements")
    void testRejectsLicenseMismatch() {
        testDriver.setLicenseType("B2"); // Vehicle requires FC (heavy semi-trailer)

        when(tripRepository.findByIdWithRelations(10)).thenReturn(Optional.of(testTrip));
        when(driverRepository.findById(5)).thenReturn(Optional.of(testDriver));
        when(tripAssignmentRepository.countActiveAssignmentsByDriverId(5)).thenReturn(0L);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                matchingService.validateAssignment(10, 5, null));
        assertTrue(ex.getMessage().contains("Driver license (B2) does not match vehicle requirement (FC)"));
    }

    @Test
    @DisplayName("validateAssignment rejects vehicle when cargo weight exceeds vehicle capacity")
    void testRejectsInsufficientVehicleCapacity() {
        testVehicle.setCapacityTons(new BigDecimal("10.0")); // Vehicle can only take 10 tons

        Order heavyOrder = new Order();
        heavyOrder.setOrderId(1);
        heavyOrder.setWeightTons(new BigDecimal("14.5")); // Cargo is 14.5 tons
        testTrip.setOrders(List.of(heavyOrder));

        when(tripRepository.findByIdWithRelations(10)).thenReturn(Optional.of(testTrip));
        when(driverRepository.findById(5)).thenReturn(Optional.of(testDriver));
        when(tripAssignmentRepository.countActiveAssignmentsByDriverId(5)).thenReturn(0L);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                matchingService.validateAssignment(10, 5, null));
        assertTrue(ex.getMessage().contains("Vehicle capacity (10.0 tons) is insufficient for trip cargo (14.5 tons)"));
    }

    @Test
    @DisplayName("validateAssignment succeeds when all constraints and invariants pass")
    void testValidateAssignmentSuccess() {
        Order safeOrder = new Order();
        safeOrder.setOrderId(2);
        safeOrder.setWeightTons(new BigDecimal("12.0"));
        testTrip.setOrders(List.of(safeOrder));

        when(tripRepository.findByIdWithRelations(10)).thenReturn(Optional.of(testTrip));
        when(driverRepository.findById(5)).thenReturn(Optional.of(testDriver));
        when(tripAssignmentRepository.countActiveAssignmentsByDriverId(5)).thenReturn(0L);

        assertDoesNotThrow(() -> matchingService.validateAssignment(10, 5, null));
    }
}

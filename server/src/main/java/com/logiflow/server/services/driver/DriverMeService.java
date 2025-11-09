package com.logiflow.server.services.driver;

import com.logiflow.server.dtos.driver.DriverDtos.*;
import com.logiflow.server.models.*;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.driver_worklog.DriverWorkLogRepository;
import com.logiflow.server.repositories.trip.TripRepository;
import com.logiflow.server.repositories.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DriverMeService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final DriverWorkLogRepository driverWorkLogRepository;

    public DriverMeService(UserRepository userRepository,
                           DriverRepository driverRepository,
                           TripRepository tripRepository,
                           DriverWorkLogRepository driverWorkLogRepository) {
        this.userRepository = userRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.driverWorkLogRepository = driverWorkLogRepository;
    }

    /** Lấy driver từ Authentication.getName() — có thể là số (userId) hoặc username */
    public Driver getCurrentDriver(String authName) {
        Optional<User> userOpt;
        try {
            Integer id = Integer.parseInt(authName);
            userOpt = userRepository.findByIdWithRole(id); // đã có sẵn
        } catch (NumberFormatException ex) {
            userOpt = userRepository.findByUsernameWithRole(authName); // đã có sẵn
        }
        User user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
        return driverRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Driver not found for current user"));
    }

    public List<TripSummaryDto> getMyTrips(Integer driverId, String status) {
        List<Trip> trips = tripRepository.findTripsByDriverAndStatus(driverId, status);
        return trips.stream().map(this::toSummary).toList();
    }

    public TripDetailDto getMyTripDetail(Integer driverId, Integer tripId) {
        Trip trip = tripRepository.findTripByDriverAndTripId(driverId, tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found or not assigned to you"));
        return toDetail(trip);
    }

    public void updateMyLocation(Integer driverId, BigDecimal lat, BigDecimal lng) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        driver.setCurrentLocationLat(lat);
        driver.setCurrentLocationLng(lng);
        // JPA sẽ flush khi transaction commit
    }

    public List<ScheduleItemDto> getMySchedule(Integer driverId, LocalDate start, LocalDate end) {
        LocalDateTime from = start.atStartOfDay();
        LocalDateTime to = end.plusDays(1).atStartOfDay(); // inclusive end-day
        List<Trip> trips = tripRepository.findTripsByDriverAndDateRange(driverId, from, to);
        return trips.stream().map(t -> new ScheduleItemDto(
                t.getTripId(),
                t.getScheduledDeparture(),
                t.getScheduledArrival(),
                t.getStatus(),
                t.getRoute() != null ? t.getRoute().getRouteName() : null
        )).sorted(Comparator.comparing(ScheduleItemDto::getScheduledDeparture)).toList();
    }

    public ComplianceDto getMyCompliance(Integer driverId) {
        // đơn giản: tổng cộng giờ đã làm + yêu cầu nghỉ tối thiểu 8h nếu lái > 8h
        BigDecimal hours = driverWorkLogRepository.sumHoursWorkedByDriverId(driverId);
        // logic đơn giản: nếu hours >= 8 thì bắt buộc nghỉ 8h, nếu <8 thì restRequired = 0
        BigDecimal restRequired = hours != null && hours.compareTo(new BigDecimal("8.00")) >= 0
                ? new BigDecimal("8.00")
                : BigDecimal.ZERO;

        // lấy nextAvailableTime gần nhất từ DriverWorkLog (nếu có)
        LocalDateTime nextAvailable = null;
        // cách đơn giản: không có repo riêng, ta có thể để null (hoặc sau này bổ sung query)
        // Trong bản tối giản: trả null, vẫn compile & chạy.

        return new ComplianceDto(hours == null ? BigDecimal.ZERO : hours, restRequired, nextAvailable);
    }

    // ======= mapping =======
    private TripSummaryDto toSummary(Trip t) {
        String plate = (t.getVehicle() != null) ? t.getVehicle().getLicensePlate() : null;
        String routeName = (t.getRoute() != null) ? t.getRoute().getRouteName() : null;
        return new TripSummaryDto(
                t.getTripId(),
                t.getStatus(),
                t.getTripType(),
                t.getScheduledDeparture(),
                t.getScheduledArrival(),
                routeName,
                plate
        );
    }

    private TripDetailDto toDetail(Trip t) {
        TripDetailDto dto = new TripDetailDto();
        dto.setTripId(t.getTripId());
        dto.setStatus(t.getStatus());
        dto.setTripType(t.getTripType());
        dto.setScheduledDeparture(t.getScheduledDeparture());
        dto.setScheduledArrival(t.getScheduledArrival());
        dto.setActualDeparture(t.getActualDeparture());
        dto.setActualArrival(t.getActualArrival());

        if (t.getRoute() != null) {
            dto.setRouteName(t.getRoute().getRouteName());
            dto.setOriginAddress(t.getRoute().getOriginAddress());
            dto.setDestinationAddress(t.getRoute().getDestinationAddress());
        }
        if (t.getVehicle() != null) {
            dto.setVehicleType(t.getVehicle().getVehicleType());
            dto.setVehiclePlate(t.getVehicle().getLicensePlate());
            dto.setVehicleCapacity(t.getVehicle().getCapacity());
        }
        if (t.getOrders() != null) {
            dto.setOrders(t.getOrders().stream().map(o ->
                    new OrderBrief(
                            o.getOrderId(),
                            o.getCustomerName(),
                            o.getPickupAddress(),
                            o.getDeliveryAddress(),
                            o.getOrderStatus() != null ? o.getOrderStatus().name() : null,
                            o.getPriorityLevel() != null ? o.getPriorityLevel().name() : null
                    )
            ).toList());
        }
        return dto;
    }
}

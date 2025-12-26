package com.logiflow.server.services.admin;

import com.logiflow.server.dtos.admin.user_management.*;
import com.logiflow.server.models.*;
import com.logiflow.server.repositories.customer.CustomerRepository;
import com.logiflow.server.repositories.driver.DriverRepository;
import com.logiflow.server.repositories.role.RoleRepository;
import com.logiflow.server.repositories.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserManagementServiceImpl implements UserManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private com.logiflow.server.services.file.FileStorageService fileStorageService;

    @Override
    @Transactional
    public UserDto createUser(UserCreationDto userCreationDto) {
        // Validate uniqueness
        if (userRepository.findByUsername(userCreationDto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(userCreationDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Validate role exists
        Role role = roleRepository.findById(userCreationDto.getRoleId())
            .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = new User();
        user.setUsername(userCreationDto.getUsername());
        user.setEmail(userCreationDto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(userCreationDto.getPassword()));
        user.setFullName(userCreationDto.getFullName());
        user.setPhone(userCreationDto.getPhone());
        user.setProfilePictureUrl(userCreationDto.getProfilePictureUrl());
        user.setRole(role);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        auditLogService.log(
            "CREATE_USER",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Created user: " + savedUser.getUsername() + " (ID: " + savedUser.getUserId() + ")"
        );
        return convertToDto(savedUser);
    }

    @Override
    @Transactional
    public UserDto updateUser(UserUpdateDto userUpdateDto) {
        User user = userRepository.findByIdWithRole(userUpdateDto.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check uniqueness only if username/email changed
        if (!user.getUsername().equals(userUpdateDto.getUsername()) &&
            userRepository.findByUsername(userUpdateDto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (!user.getEmail().equals(userUpdateDto.getEmail()) &&
            userRepository.findByEmail(userUpdateDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        user.setUsername(userUpdateDto.getUsername());
        user.setEmail(userUpdateDto.getEmail());
        
        if (userUpdateDto.getFullName() != null) {
            user.setFullName(userUpdateDto.getFullName());
        }
        if (userUpdateDto.getPhone() != null) {
            user.setPhone(userUpdateDto.getPhone());
        }
        String oldProfilePicture = user.getProfilePictureUrl();
        int oldRefs = 0;
        if (oldProfilePicture != null) {
            oldRefs = userRepository.countByProfilePictureUrl(oldProfilePicture);
        }

        if (userUpdateDto.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(userUpdateDto.getProfilePictureUrl());
        }

        if (userUpdateDto.getRoleId() != null) {
            Role role = roleRepository.findById(userUpdateDto.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found"));
            user.setRole(role);
        }

        if (userUpdateDto.getIsActive() != null) {
            user.setIsActive(userUpdateDto.getIsActive());
        }

        User savedUser = userRepository.save(user);

        // If profile picture changed and old was only referenced by this user, delete file
        try {
            if (oldProfilePicture != null && !oldProfilePicture.equals(savedUser.getProfilePictureUrl()) && oldRefs <= 1) {
                try {
                    fileStorageService.deleteProfilePicture(oldProfilePicture);
                } catch (Exception ex) {
                    // ignore deletion errors
                }
            }
        } catch (Exception ex) {
            // swallow
        }

        auditLogService.log(
            "UPDATE_USER",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Updated user: " + savedUser.getUsername() + " (ID: " + savedUser.getUserId() + ")"
        );
        return convertToDto(savedUser);
    }

    @Override
    @Transactional
    public UserDto toggleUserActiveStatus(Integer userId) {
        User user = userRepository.findByIdWithRole(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsActive(!user.getIsActive());
        User savedUser = userRepository.save(user);

        auditLogService.log(
            "TOGGLE_USER_STATUS",
            "admin", // TODO: replace with actual username from context
            "ADMIN", // TODO: replace with actual role from context
            "Toggled status for user: " + savedUser.getUsername() + " (ID: " + savedUser.getUserId() + ") to " + savedUser.getIsActive()
        );
        return convertToDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDto> getUserById(Integer userId) {
        return userRepository.findByIdWithRole(userId)
            .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> getUsers(Pageable pageable) {
        List<User> users = userRepository.findAllUsersWithRole();
        List<UserDto> userDtos = users.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());

        // Simple pagination implementation - in real app, use proper pagination queries
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), userDtos.size());
        List<UserDto> pageContent = userDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, userDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(String roleName) {
        return userRepository.findByRoleNameWithRole(roleName).stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getActiveUsers() {
        return userRepository.findActiveUsersWithRole().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> searchUsers(String searchTerm, Pageable pageable) {
        List<User> users = userRepository.searchUsersByUsernameOrEmail(searchTerm);
        List<UserDto> userDtos = users.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());

        // Simple pagination for search results
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), userDtos.size());
        List<UserDto> pageContent = userDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, userDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DriverUserDto> getDrivers(Pageable pageable) {
        List<Driver> drivers = driverRepository.findAllDriversWithUser();
        List<DriverUserDto> driverDtos = drivers.stream()
            .map(this::convertToDriverDto)
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), driverDtos.size());
        List<DriverUserDto> pageContent = driverDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, driverDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerUserDto> getCustomers(Pageable pageable) {
        List<Customer> customers = customerRepository.findAllCustomersWithUser();
        List<CustomerUserDto> customerDtos = customers.stream()
            .map(this::convertToCustomerDto)
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), customerDtos.size());
        List<CustomerUserDto> pageContent = customerDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, customerDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DispatcherUserDto> getDispatchers(Pageable pageable) {
        List<User> users = userRepository.findByRoleNameWithRole("DISPATCHER");
        List<DispatcherUserDto> dispatcherDtos = users.stream()
            .map(this::convertToDispatcherDto)
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dispatcherDtos.size());
        List<DispatcherUserDto> pageContent = dispatcherDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, dispatcherDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DriverUserDto> searchDrivers(String searchTerm, Pageable pageable) {
        List<Driver> drivers = driverRepository.findAllDriversWithUser();
        List<DriverUserDto> driverDtos = drivers.stream()
            .map(this::convertToDriverDto)
            .filter(dto -> dto.getUsername().toLowerCase().contains(searchTerm.toLowerCase()) ||
                          dto.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), driverDtos.size());
        List<DriverUserDto> pageContent = driverDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, driverDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerUserDto> searchCustomers(String searchTerm, Pageable pageable) {
        List<Customer> customers = customerRepository.findAllCustomersWithUser();
        List<CustomerUserDto> customerDtos = customers.stream()
            .map(this::convertToCustomerDto)
            .filter(dto -> dto.getUsername().toLowerCase().contains(searchTerm.toLowerCase()) ||
                          dto.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), customerDtos.size());
        List<CustomerUserDto> pageContent = customerDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, customerDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DispatcherUserDto> searchDispatchers(String searchTerm, Pageable pageable) {
        List<User> users = userRepository.findByRoleNameWithRole("DISPATCHER");
        List<DispatcherUserDto> dispatcherDtos = users.stream()
            .map(this::convertToDispatcherDto)
            .filter(dto -> dto.getUsername().toLowerCase().contains(searchTerm.toLowerCase()) ||
                          dto.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dispatcherDtos.size());
        List<DispatcherUserDto> pageContent = dispatcherDtos.subList(start, end);

        return new PageImpl<>(pageContent, pageable, dispatcherDtos.size());
    }

    private UserDto convertToDto(User user) {
        return UserDto.fromUser(
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.getProfilePictureUrl(),
            user.getRole() != null ? user.getRole().getRoleName() : null,
            user.getIsActive(),
            user.getCreatedAt(),
            user.getLastLogin()
        );
    }

    private DriverUserDto convertToDriverDto(Driver driver) {
        User user = driver.getUser();
        return DriverUserDto.fromUserAndDriver(
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.getProfilePictureUrl(),
            user.getRole() != null ? user.getRole().getRoleName() : null,
            user.getIsActive(),
            user.getCreatedAt(),
            user.getLastLogin(),
            driver.getLicenseType(),
            driver.getLicenseNumber(),
            driver.getLicenseExpiryDate(),
            driver.getLicenseIssueDate(),
            driver.getYearsExperience(),
            driver.getHealthStatus().toString(),
            driver.getCurrentLocationLat(),
            driver.getCurrentLocationLng(),
            driver.getRating(),
            driver.getStatus()
        );
    }

    private CustomerUserDto convertToCustomerDto(Customer customer) {
        User user = customer.getUser();
        return CustomerUserDto.fromUserAndCustomer(
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.getProfilePictureUrl(),
            user.getRole() != null ? user.getRole().getRoleName() : null,
            user.getIsActive(),
            user.getCreatedAt(),
            user.getLastLogin(),
            customer.getCompanyName(),
            customer.getCompanyCode(),
            customer.getDefaultDeliveryAddress(),
            customer.getPreferredPaymentMethod(),
            customer.getTotalOrders(),
            customer.getTotalSpent(),
            customer.getLastOrderDate()
        );
    }

    private DispatcherUserDto convertToDispatcherDto(User user) {
        return DispatcherUserDto.fromUser(
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.getProfilePictureUrl(),
            user.getRole() != null ? user.getRole().getRoleName() : null,
            user.getIsActive(),
            user.getCreatedAt(),
            user.getLastLogin()
        );
    }
}

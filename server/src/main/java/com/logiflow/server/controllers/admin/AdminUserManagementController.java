package com.logiflow.server.controllers.admin;

import com.logiflow.server.dtos.admin.user_management.UserDto;
import com.logiflow.server.dtos.admin.user_management.UserCreationDto;
import com.logiflow.server.dtos.admin.user_management.UserUpdateDto;
import com.logiflow.server.services.admin.UserManagementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/user-management")
public class AdminUserManagementController {

    private final UserManagementService userManagementService;

    public AdminUserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public ResponseEntity<Page<UserDto>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userManagementService.getUsers(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Integer id) {
        Optional<UserDto> user = userManagementService.getUserById(id);
        return user.map(ResponseEntity::ok)
                  .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/role/{roleName}")
    public ResponseEntity<List<UserDto>> getUsersByRole(@PathVariable String roleName) {
        List<UserDto> users = userManagementService.getUsersByRole(roleName);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/active")
    public ResponseEntity<List<UserDto>> getActiveUsers() {
        List<UserDto> users = userManagementService.getActiveUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserDto>> searchUsers(
            @RequestParam String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userManagementService.searchUsers(term, pageable));
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserCreationDto userCreationDto) {
        try {
            UserDto createdUser = userManagementService.createUser(userCreationDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping
    public ResponseEntity<UserDto> updateUser(@Valid @RequestBody UserUpdateDto userUpdateDto) {
        try {
            UserDto updatedUser = userManagementService.updateUser(userUpdateDto);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<UserDto> toggleUserStatus(@PathVariable Integer id) {
        try {
            UserDto updatedUser = userManagementService.toggleUserActiveStatus(id);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        try {
            userManagementService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

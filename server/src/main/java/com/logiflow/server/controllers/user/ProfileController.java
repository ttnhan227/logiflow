package com.logiflow.server.controllers.user;

import com.logiflow.server.dtos.user.ProfileDto;
import com.logiflow.server.services.user.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("/profile")
    public ResponseEntity<ProfileDto> getProfile(Authentication authentication) {
        try {
            String username = authentication.getName();
            ProfileDto profileDto = profileService.getProfile(username);
            return ResponseEntity.ok(profileDto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<ProfileDto> getProfileById(@PathVariable Integer userId) {
        try {
            ProfileDto profileDto = profileService.getProfileByUserId(userId);
            return ResponseEntity.ok(profileDto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileDto> updateProfile(Authentication authentication, @RequestBody com.logiflow.server.dtos.user.ProfileUpdateDto profileUpdateDto) {
        try {
            String username = authentication.getName();
            ProfileDto updated = profileService.updateProfile(username, profileUpdateDto);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/profile/password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
                                             @RequestParam String currentPassword,
                                             @RequestParam String newPassword) {
        try {
            String username = authentication.getName();
            profileService.changePassword(username, currentPassword, newPassword);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

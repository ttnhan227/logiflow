package com.logiflow.server.controllers.user;

import com.logiflow.server.dtos.user.ProfileDto;
import com.logiflow.server.dtos.user.ProfileUpdateDto;
import com.logiflow.server.services.user.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileDto> getProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getProfile(authentication.getName()));
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<ProfileDto> getProfileById(@PathVariable Integer userId) {
        return ResponseEntity.ok(profileService.getProfileByUserId(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileDto> updateProfile(Authentication authentication,
                                                    @Valid @RequestBody ProfileUpdateDto profileUpdateDto) {
        return ResponseEntity.ok(profileService.updateProfile(authentication.getName(), profileUpdateDto));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
                                             @RequestParam String currentPassword,
                                             @RequestParam String newPassword) {
        profileService.changePassword(authentication.getName(), currentPassword, newPassword);
        return ResponseEntity.ok().build();
    }
}

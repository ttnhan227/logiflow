package com.logiflow.server.services.user;

import com.logiflow.server.dtos.user.ProfileDto;

public interface ProfileService {

    ProfileDto getProfile(String username);

    ProfileDto getProfileByUserId(Integer userId);

    ProfileDto updateProfile(String username, com.logiflow.server.dtos.user.ProfileUpdateDto profileUpdateDto);

    void changePassword(String username, String currentPassword, String newPassword);
}

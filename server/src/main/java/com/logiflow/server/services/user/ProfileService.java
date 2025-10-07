package com.logiflow.server.services.user;

import com.logiflow.server.dtos.user.ProfileDto;

public interface ProfileService {

    ProfileDto getProfile(String username);

    ProfileDto getProfileByUserId(Integer userId);
}

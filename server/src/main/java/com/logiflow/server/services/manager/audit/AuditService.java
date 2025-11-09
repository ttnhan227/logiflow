package com.logiflow.server.services.manager.audit;

import com.logiflow.server.dtos.manager.audit.AuditActivityDto;

import java.util.List;

public interface AuditService {
    List<AuditActivityDto> activities();
}

package com.logiflow.server.dtos.manager.compliance;

import java.util.List;

public class ComplianceCheckDto {
    private boolean ok;
    private List<String> violations;

    public ComplianceCheckDto() {
    }

    public ComplianceCheckDto(boolean ok, List<String> violations) {
        this.ok = ok;
        this.violations = violations;
    }

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public List<String> getViolations() {
        return violations;
    }

    public void setViolations(List<String> violations) {
        this.violations = violations;
    }
}

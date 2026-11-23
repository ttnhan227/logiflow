package com.logiflow.server.configs;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Runs immediately after Spring Boot's ServerHttpObservationFilter (HIGHEST_PRECEDENCE + 1)
 * and before Spring Security's FilterChainProxy so every HTTP response (including 401/403/404/500)
 * includes the active W3C 32-char hex X-Trace-Id header.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class TraceCorrelationFilter extends OncePerRequestFilter {

    public static final String TRACE_ID_HEADER = "X-Trace-Id";

    private final Tracer tracer;

    public TraceCorrelationFilter(ObjectProvider<Tracer> tracerProvider) {
        this.tracer = tracerProvider.getIfAvailable(() -> Tracer.NOOP);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        applyTraceHeader(response);
        try {
            filterChain.doFilter(request, response);
        } finally {
            if (!response.isCommitted() && response.getHeader(TRACE_ID_HEADER) == null) {
                applyTraceHeader(response);
            }
        }
    }

    private void applyTraceHeader(HttpServletResponse response) {
        Span currentSpan = tracer.currentSpan();
        if (currentSpan != null && currentSpan.context() != null) {
            String traceId = currentSpan.context().traceId();
            if (traceId != null && !traceId.isBlank()) {
                response.setHeader(TRACE_ID_HEADER, traceId);
            }
        }
    }
}

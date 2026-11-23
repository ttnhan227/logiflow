package com.logiflow.server;

import com.logiflow.server.dtos.dispatch.TripStatusUpdateRequest;
import com.logiflow.server.exceptions.ResourceNotFoundException;
import com.logiflow.server.services.dispatch.TripService;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter;
import io.opentelemetry.sdk.testing.exporter.InMemorySpanExporter;
import io.opentelemetry.sdk.trace.SpanProcessor;
import io.opentelemetry.sdk.trace.data.SpanData;
import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc // Spring Security filter chain intentionally enabled
@AutoConfigureObservability
@Import(OpenTelemetryTracingIntegrationTest.OtelTestConfig.class)
class OpenTelemetryTracingIntegrationTest {

    private static final String TRACE_ID_REGEX = "^[0-9a-f]{32}$";

    @TestConfiguration
    static class OtelTestConfig {
        @Bean
        InMemorySpanExporter inMemorySpanExporter() {
            return InMemorySpanExporter.create();
        }

        @Bean
        SpanProcessor inMemorySpanProcessor(InMemorySpanExporter exporter) {
            return SimpleSpanProcessor.create(exporter);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InMemorySpanExporter spanExporter;

    @Autowired
    private TripService tripService;

    @Autowired
    private ObjectProvider<OtlpHttpSpanExporter> otlpSpanExporterProvider;

    @BeforeEach
    void resetSpans() {
        spanExporter.reset();
    }

    @Test
    void healthAndUnauthorizedEndpointsEmitValidTraceIdHeaderAndCorsExposure() throws Exception {
        MvcResult healthResult = mockMvc.perform(get("/actuator/health")
                        .header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Trace-Id"))
                .andReturn();

        String healthTraceId = healthResult.getResponse().getHeader("X-Trace-Id");
        assertThat(healthTraceId).matches(TRACE_ID_REGEX);

        String exposedHeaders = healthResult.getResponse().getHeader("Access-Control-Expose-Headers");
        assertThat(exposedHeaders).contains("X-Trace-Id");

        // Protected endpoint without credentials -> rejected by Spring Security (401 or 403), still includes X-Trace-Id
        MvcResult unauthResult = mockMvc.perform(get("/api/dispatch/trips"))
                .andExpect(header().exists("X-Trace-Id"))
                .andReturn();

        int statusCode = unauthResult.getResponse().getStatus();
        assertThat(statusCode).isIn(401, 403);
        String unauthTraceId = unauthResult.getResponse().getHeader("X-Trace-Id");
        assertThat(unauthTraceId).matches(TRACE_ID_REGEX);
    }

    @Test
    void incomingW3CTraceparentPropagatesToServerSpanAndResponseHeaderWithoutSecretLeakage() throws Exception {
        String incomingTraceId = "4bf92f3577b34da6a3ce929d0e0e4736";
        String incomingParentSpanId = "00f067aa0ba902b7";
        String traceparent = "00-" + incomingTraceId + "-" + incomingParentSpanId + "-01";
        String secretJwt = "super-secret-jwt-token-do-not-export-99999";
        String secretCookie = "super-secret-cookie-value-88888";

        MvcResult result = mockMvc.perform(get("/actuator/health")
                        .header("traceparent", traceparent)
                        .header("Authorization", "Bearer " + secretJwt)
                        .cookie(new Cookie("auth_token", secretCookie)))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Trace-Id", incomingTraceId))
                .andReturn();

        assertThat(result.getResponse().getHeader("X-Trace-Id")).isEqualTo(incomingTraceId);

        List<SpanData> spans = spanExporter.getFinishedSpanItems();
        assertThat(spans).isNotEmpty();
        assertThat(spans).anySatisfy(span -> {
            assertThat(span.getTraceId()).isEqualTo(incomingTraceId);
        });

        // Verify zero JWT/Cookie/Authorization header secret leakage in any exported span attribute
        for (SpanData span : spans) {
            for (Map.Entry<AttributeKey<?>, Object> entry : span.getAttributes().asMap().entrySet()) {
                String key = entry.getKey().getKey().toLowerCase();
                String val = String.valueOf(entry.getValue());
                assertThat(key)
                        .isNotEqualTo("authorization")
                        .doesNotContain("header.authorization")
                        .doesNotContain("cookie");
                assertThat(val)
                        .doesNotContain(secretJwt)
                        .doesNotContain(secretCookie)
                        .doesNotContain("Bearer ");
            }
        }
    }

    @Test
    void customTripStatusUpdateSpanIsExportedWithNonPiiAttributes() {
        TripStatusUpdateRequest req = new TripStatusUpdateRequest();
        req.setStatus("in_progress");

        assertThatThrownBy(() -> tripService.updateTripStatus(-999999, req))
                .isInstanceOf(ResourceNotFoundException.class);

        List<SpanData> spans = spanExporter.getFinishedSpanItems();
        assertThat(spans).anySatisfy(span -> {
            assertThat(span.getName()).isEqualTo("logiflow.trip.status_update");
            assertThat(span.getAttributes().get(AttributeKey.stringKey("trip.status.target")))
                    .isEqualTo("in_progress");
            assertThat(span.getAttributes().get(AttributeKey.stringKey("trip.status.outcome")))
                    .isEqualTo("error");
        });
    }

    @Test
    void otlpExporterIsDisabledByDefaultInTests() {
        assertThat(otlpSpanExporterProvider.getIfAvailable()).isNull();
    }
}

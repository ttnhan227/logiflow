package com.logiflow.server.services.maps;

import com.logiflow.server.services.payment.PayPalServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.http.client.AbstractClientHttpRequestFactoryWrapper;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;

class MapsAndPayPalTimeoutUnitTest {

    private SimpleClientHttpRequestFactory unwrapFactory(RestTemplate restTemplate) {
        ClientHttpRequestFactory factory = restTemplate.getRequestFactory();
        while (factory instanceof AbstractClientHttpRequestFactoryWrapper) {
            factory = (ClientHttpRequestFactory) ReflectionTestUtils.getField(factory, "requestFactory");
        }
        return assertInstanceOf(SimpleClientHttpRequestFactory.class, factory);
    }

    @Test
    void mapsServiceConfiguresConnectAndReadTimeouts() {
        MapsServiceImpl service = new MapsServiceImpl();
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        assertNotNull(restTemplate);

        SimpleClientHttpRequestFactory factory = unwrapFactory(restTemplate);

        Integer connectTimeout = (Integer) ReflectionTestUtils.getField(factory, "connectTimeout");
        Integer readTimeout = (Integer) ReflectionTestUtils.getField(factory, "readTimeout");
        assertNotNull(connectTimeout);
        assertNotNull(readTimeout);
        assertEquals(5000, connectTimeout);
        assertEquals(10000, readTimeout);
    }

    @Test
    void payPalServiceConfiguresConnectAndReadTimeouts() {
        PayPalServiceImpl service = new PayPalServiceImpl();
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        assertNotNull(restTemplate);

        SimpleClientHttpRequestFactory factory = unwrapFactory(restTemplate);

        Integer connectTimeout = (Integer) ReflectionTestUtils.getField(factory, "connectTimeout");
        Integer readTimeout = (Integer) ReflectionTestUtils.getField(factory, "readTimeout");
        assertNotNull(connectTimeout);
        assertNotNull(readTimeout);
        assertEquals(5000, connectTimeout);
        assertEquals(15000, readTimeout);
    }
}

package com.smartcampus.auth.service;

import com.smartcampus.booking.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class GoogleTokenService {

    private static final String TOKEN_INFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final Set<String> expectedAudiences;
    private final RestTemplate restTemplate;

    public GoogleTokenService(
            @Value("${app.auth.google.client-id:}") String expectedAudience,
            @Value("${app.auth.google.allowed-audiences:}") String allowedAudiences
    ) {
        this.expectedAudiences = parseExpectedAudiences(expectedAudience, allowedAudiences);
        this.restTemplate = new RestTemplate();
    }

    public GoogleProfile verifyIdToken(String idToken) {
        String token = idToken == null ? "" : idToken.trim();
        if (token.isEmpty()) {
            throw new BadRequestException("Google ID token is required.");
        }

        try {
            String url = TOKEN_INFO_ENDPOINT + URLEncoder.encode(token, StandardCharsets.UTF_8);

            @SuppressWarnings("unchecked")
            Map<String, Object> payload = restTemplate.getForObject(url, Map.class);

            if (payload == null || payload.isEmpty()) {
                throw new BadRequestException("Google token verification failed.");
            }

            if (expectedAudiences.isEmpty()) {
                throw new BadRequestException("Google login is not configured on backend.");
            }

            String audience = normalizeValue(asString(payload.get("aud")));
            String authorizedParty = normalizeValue(asString(payload.get("azp")));
            boolean audienceMatched = expectedAudiences.contains(audience)
                    || (authorizedParty != null && expectedAudiences.contains(authorizedParty));

            if (!audienceMatched) {
                String receivedAudience = audience == null || audience.isBlank() ? "<missing>" : audience;
                String receivedAzp = authorizedParty == null || authorizedParty.isBlank() ? "<missing>" : authorizedParty;
                throw new BadRequestException(
                    "Google token audience mismatch. Ensure frontend and backend use the same Google client ID. " +
                        "received aud=" + receivedAudience + ", azp=" + receivedAzp
                );
            }

            String emailVerified = asString(payload.get("email_verified"));
            if (!"true".equalsIgnoreCase(emailVerified)) {
                throw new BadRequestException("Google account email must be verified.");
            }

            String email = asString(payload.get("email"));
            String subject = asString(payload.get("sub"));
            if (email == null || email.isBlank() || subject == null || subject.isBlank()) {
                throw new BadRequestException("Google token response is missing required user data.");
            }

            String displayName = asString(payload.get("name"));
            if (displayName == null || displayName.isBlank()) {
                displayName = email;
            }

            String picture = asString(payload.get("picture"));
            return new GoogleProfile(subject, email.toLowerCase(Locale.ROOT), displayName, picture);
        } catch (RestClientException ex) {
            throw new BadRequestException("Unable to verify Google token.");
        }
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private Set<String> parseExpectedAudiences(String expectedAudience, String allowedAudiences) {
        Set<String> audiences = new LinkedHashSet<>();
        Arrays.stream(((allowedAudiences == null ? "" : allowedAudiences) + "," +
                        (expectedAudience == null ? "" : expectedAudience)).split(","))
                .map(this::normalizeValue)
                .filter(value -> value != null && !value.isBlank())
                .forEach(audiences::add);

        return audiences;
    }

    private String normalizeValue(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.length() >= 2) {
            boolean quotedWithDouble = normalized.startsWith("\"") && normalized.endsWith("\"");
            boolean quotedWithSingle = normalized.startsWith("'") && normalized.endsWith("'");
            if (quotedWithDouble || quotedWithSingle) {
                normalized = normalized.substring(1, normalized.length() - 1).trim();
            }
        }

        return normalized;
    }

    public record GoogleProfile(String subject, String email, String name, String pictureUrl) {
    }
}

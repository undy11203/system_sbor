package com.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory store for email verification codes.
 * Each code expires after auth.code.ttl-minutes minutes.
 */
@Service
public class CodeStorageService {

    @Value("${auth.code.ttl-minutes:10}")
    private long ttlMinutes;

    private record Entry(String code, Instant expiresAt) {}

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public void save(String email, String code) {
        store.put(email.toLowerCase(), new Entry(code, Instant.now().plusSeconds(ttlMinutes * 60)));
    }

    public boolean verify(String email, String code) {
        Entry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(email.toLowerCase());
            return false;
        }
        return entry.code().equals(code);
    }

    public void invalidate(String email) {
        store.remove(email.toLowerCase());
    }
}

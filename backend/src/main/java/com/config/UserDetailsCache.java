package com.config;

import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class UserDetailsCache {
    private static final long TTL_MS = 30_000L;
    private static final int MAX_ENTRIES = 1_000;

    private record Entry(UserDetails details, long expiresAtMs) { }

    private final ConcurrentHashMap<String, Entry> entries =
            new ConcurrentHashMap<>();
    private final UserDetailsServiceImpl delegate;

    public UserDetailsCache(UserDetailsServiceImpl delegate) {
        this.delegate = delegate;
    }

    public UserDetails get(String email) throws UsernameNotFoundException {
        String key = email.toLowerCase(Locale.ROOT);
        long now = System.currentTimeMillis();
        Entry hit = entries.get(key);
        if (hit != null && hit.expiresAtMs() > now) {
            return hit.details();
        }

        UserDetails fresh = delegate.loadUserByUsername(email);
        if (entries.size() >= MAX_ENTRIES) {
            entries.clear();
        }
        entries.put(key, new Entry(fresh, now + TTL_MS));
        return fresh;
    }

    public void evict(String email) {
        if (email != null) {
            entries.remove(email.toLowerCase(Locale.ROOT));
        }
    }
}

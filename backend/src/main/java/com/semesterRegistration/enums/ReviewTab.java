package com.semesterRegistration.enums;

import java.util.Locale;

public enum ReviewTab {
    ALL,
    PENDING,
    APPROVED,
    REJECTED;

    public static ReviewTab parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return PENDING;
        }
        try {
            return valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid status filter '" + raw
                            + "'. Use ALL, PENDING, APPROVED or REJECTED."
            );
        }
    }
}

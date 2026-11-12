package com.bonafide.service;

import com.bonafide.entity.BonafideStatus;
import com.exception.BadRequestException;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

public final class BonafideReviewGroups {
    private BonafideReviewGroups() { }

    public enum Viewer {
        DSW,
        PRINCIPAL
    }

    public enum Tab {
        ALL,
        PENDING,
        APPROVED,
        REJECTED;

        public static Tab parse(String raw) {
            if (raw == null || raw.isBlank()) {
                return PENDING;
            }
            try {
                return valueOf(raw.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException(
                        "Invalid status filter '" + raw
                                + "'. Use ALL, PENDING, APPROVED or REJECTED."
                );
            }
        }
    }

    public static Set<BonafideStatus> statuses(Viewer viewer, Tab tab) {
        return switch (viewer) {
            case DSW -> switch (tab) {
                case ALL -> EnumSet.of(
                        BonafideStatus.SUBMITTED,
                        BonafideStatus.PENDING_DSW,
                        BonafideStatus.DSW_APPROVED,
                        BonafideStatus.DSW_REJECTED,
                        BonafideStatus.PENDING_PRINCIPAL,
                        BonafideStatus.PRINCIPAL_APPROVED,
                        BonafideStatus.PRINCIPAL_REJECTED,
                        BonafideStatus.CERTIFICATE_GENERATED
                );
                case PENDING -> EnumSet.of(
                        BonafideStatus.SUBMITTED,
                        BonafideStatus.PENDING_DSW
                );
                case APPROVED -> EnumSet.of(
                        BonafideStatus.DSW_APPROVED,
                        BonafideStatus.PENDING_PRINCIPAL,
                        BonafideStatus.PRINCIPAL_APPROVED,
                        BonafideStatus.PRINCIPAL_REJECTED,
                        BonafideStatus.CERTIFICATE_GENERATED
                );
                case REJECTED -> EnumSet.of(BonafideStatus.DSW_REJECTED);
            };
            case PRINCIPAL -> switch (tab) {
                case ALL -> EnumSet.of(
                        BonafideStatus.DSW_APPROVED,
                        BonafideStatus.PENDING_PRINCIPAL,
                        BonafideStatus.PRINCIPAL_APPROVED,
                        BonafideStatus.CERTIFICATE_GENERATED,
                        BonafideStatus.PRINCIPAL_REJECTED
                );
                case PENDING -> EnumSet.of(
                        BonafideStatus.PENDING_PRINCIPAL,
                        BonafideStatus.DSW_APPROVED
                );
                case APPROVED -> EnumSet.of(
                        BonafideStatus.PRINCIPAL_APPROVED,
                        BonafideStatus.CERTIFICATE_GENERATED
                );
                case REJECTED -> EnumSet.of(
                        BonafideStatus.PRINCIPAL_REJECTED
                );
            };
        };
    }
}

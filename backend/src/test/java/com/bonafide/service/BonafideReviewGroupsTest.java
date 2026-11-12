package com.bonafide.service;

import com.bonafide.entity.BonafideStatus;
import com.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class BonafideReviewGroupsTest {
    @Test
    void groupsEveryStatusForDsw() {
        Map<BonafideStatus, BonafideReviewGroups.Tab> expected =
                new EnumMap<>(BonafideStatus.class);
        expected.put(BonafideStatus.SUBMITTED, BonafideReviewGroups.Tab.PENDING);
        expected.put(BonafideStatus.PENDING_DSW, BonafideReviewGroups.Tab.PENDING);
        expected.put(BonafideStatus.DSW_APPROVED, BonafideReviewGroups.Tab.APPROVED);
        expected.put(BonafideStatus.PENDING_PRINCIPAL, BonafideReviewGroups.Tab.APPROVED);
        expected.put(BonafideStatus.PRINCIPAL_APPROVED, BonafideReviewGroups.Tab.APPROVED);
        expected.put(BonafideStatus.PRINCIPAL_REJECTED, BonafideReviewGroups.Tab.APPROVED);
        expected.put(BonafideStatus.CERTIFICATE_GENERATED, BonafideReviewGroups.Tab.APPROVED);
        expected.put(BonafideStatus.DSW_REJECTED, BonafideReviewGroups.Tab.REJECTED);
        assertEveryStatus(BonafideReviewGroups.Viewer.DSW, expected);
    }

    @Test
    void groupsEveryStatusForPrincipal() {
        Map<BonafideStatus, BonafideReviewGroups.Tab> expected =
                new EnumMap<>(BonafideStatus.class);
        expected.put(BonafideStatus.DSW_APPROVED, BonafideReviewGroups.Tab.PENDING);
        expected.put(BonafideStatus.PENDING_PRINCIPAL, BonafideReviewGroups.Tab.PENDING);
        expected.put(BonafideStatus.PRINCIPAL_APPROVED, BonafideReviewGroups.Tab.APPROVED);
        expected.put(BonafideStatus.CERTIFICATE_GENERATED, BonafideReviewGroups.Tab.APPROVED);
        expected.put(BonafideStatus.PRINCIPAL_REJECTED, BonafideReviewGroups.Tab.REJECTED);
        assertEveryStatus(BonafideReviewGroups.Viewer.PRINCIPAL, expected);
    }

    @Test
    void parsesDefaultCaseInsensitiveTabsAndRejectsUnknownTab() {
        assertEquals(BonafideReviewGroups.Tab.PENDING,
                BonafideReviewGroups.Tab.parse(null));
        assertEquals(BonafideReviewGroups.Tab.PENDING,
                BonafideReviewGroups.Tab.parse(" "));
        assertEquals(BonafideReviewGroups.Tab.APPROVED,
                BonafideReviewGroups.Tab.parse("approved"));
        assertThrows(BadRequestException.class,
                () -> BonafideReviewGroups.Tab.parse("unknown"));
    }

    private void assertEveryStatus(
            BonafideReviewGroups.Viewer viewer,
            Map<BonafideStatus, BonafideReviewGroups.Tab> expected
    ) {
        for (BonafideStatus status : BonafideStatus.values()) {
            BonafideReviewGroups.Tab expectedTab = expected.get(status);
            assertEquals(expectedTab != null,
                    BonafideReviewGroups.statuses(
                            viewer,
                            BonafideReviewGroups.Tab.ALL
                    ).contains(status),
                    status.name() + " in ALL");
            for (BonafideReviewGroups.Tab tab : BonafideReviewGroups.Tab.values()) {
                boolean included = BonafideReviewGroups.statuses(viewer, tab)
                        .contains(status);
                assertEquals(expectedTab != null
                                && (tab == BonafideReviewGroups.Tab.ALL
                                || tab == expectedTab),
                        included,
                        status.name() + " in " + tab);
            }
        }
        Set<BonafideStatus> all = BonafideReviewGroups.statuses(
                viewer,
                BonafideReviewGroups.Tab.ALL
        );
        assertFalse(all.contains(BonafideStatus.DRAFT));
    }
}

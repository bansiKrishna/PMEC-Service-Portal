package com.semesterRegistration.service;

import com.semesterRegistration.enums.RegistrationStatus;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewTab;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RegistrationReviewClassifyTest {
    @Test
    void classifiesEveryDecisionAndRegistrationStatusCombination() {
        for (ReviewDecision decision : ReviewDecision.values()) {
            for (RegistrationStatus status : RegistrationStatus.values()) {
                assertEquals(expected(decision, status),
                        RegistrationReviewService.classify(decision, status),
                        decision + " / " + status);
            }
        }
    }

    @Test
    void classifiesEveryPrincipalRegistrationStatus() {
        for (RegistrationStatus status : RegistrationStatus.values()) {
            ReviewTab expected = switch (status) {
                case SUBMITTED, UNDER_REVIEW -> ReviewTab.PENDING;
                case APPROVED -> ReviewTab.APPROVED;
                case REVISION_REQUIRED -> ReviewTab.REJECTED;
                default -> null;
            };
            assertEquals(expected, RegistrationReviewService.principalTab(status));
        }
    }

    private ReviewTab expected(
            ReviewDecision decision,
            RegistrationStatus status
    ) {
        if (decision == ReviewDecision.APPROVED) {
            return ReviewTab.APPROVED;
        }
        if (decision == ReviewDecision.REJECTED
                || decision == ReviewDecision.REVISION_REQUESTED) {
            return ReviewTab.REJECTED;
        }
        if (decision == ReviewDecision.PENDING
                && (status == RegistrationStatus.SUBMITTED
                || status == RegistrationStatus.UNDER_REVIEW)) {
            return ReviewTab.PENDING;
        }
        return null;
    }
}

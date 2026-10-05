package com.bonafide.dto;

import java.time.LocalDateTime;

public record BonafideStatusResponseDto(
	Long applicationId,
	String status,
	String rejectionReason,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {
}

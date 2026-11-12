package com.bonafide.dto;

public record BonafideSummaryDto(
        long pending,
        long approved,
        long rejected,
        long total
) { }

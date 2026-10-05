package com.bonafide.service;

import com.bonafide.dto.*;

import java.util.List;

public interface BonafideService {

    BonafideApplicationResponseDto create(
            BonafideApplicationRequestDto request
    );

    BonafideApplicationResponseDto getById(
            Long id
    );

    BonafideStatusResponseDto getStatus(Long id);

    List<BonafideApplicationResponseDto>
    getMyApplications();

    List<BonafideApplicationResponseDto>
    getPendingForDsw();

    BonafideApplicationResponseDto getDswApplicationById(Long id);

    List<BonafideApplicationResponseDto>
    getPendingForPrincipal();

    void submit(Long id);

    void approveByDsw(Long id);

    void rejectByDsw(
            Long id,
            RejectBonafideRequestDto request
    );

    void approveByPrincipal(Long id);

    void rejectByPrincipal(
            Long id,
            RejectBonafideRequestDto request
    );

    byte[] downloadCertificate(Long applicationId);


    List<BonafideApplicationResponseDto> getApplicationsForDsw();

    BonafideApplicationResponseDto approveByDsw(
            Long applicationId,
            String dswEmail,
            String remarks
    );
}
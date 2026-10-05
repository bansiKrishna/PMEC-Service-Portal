package com.bonafide.serviceImpl;

import com.bonafide.dto.*;
import com.bonafide.entity.*;
import com.bonafide.repository.*;

import com.bonafide.service.BonafideService;
import com.bonafide.service.CertificateGenerationService;

import com.exception.BadRequestException;
import com.exception.ResourceNotFoundException;

import com.file.FileStorageService;

import com.user.entity.User;
import com.user.service.CurrentUserService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BonafideServiceImpl
        implements BonafideService {

    private final BonafideApplicationRepository
            applicationRepository;

    private final BonafideApprovalHistoryRepository
            historyRepository;

    private final GeneratedCertificateRepository
            certificateRepository;

    private final CertificateGenerationService
            certificateGenerationService;

    private final FileStorageService
            fileStorageService;

    private final CurrentUserService
            currentUserService;


    // =====================================================
    // STUDENT APPLY
    // =====================================================

    @Override
    public BonafideApplicationResponseDto create(
            BonafideApplicationRequestDto request) {

        User student =
                currentUserService.getCurrentUser();

        BonafideApplication application =
                BonafideApplication.builder()

                        .student(student)

                        .phoneNumber(
                                request.getPhoneNumber()
                        )

                        .hostelName(
                                request.getHostelName()
                        )

                        .roomNumber(
                                request.getRoomNumber()
                        )

                        .reason(
                                request.getReason()
                        )

                        .parentName(
                                request.getParentName()
                        )

                        .hostelAdmissionDate(
                                request.getHostelAdmissionDate()
                        )

                        .collegeAdmissionDate(
                                request.getCollegeAdmissionDate()
                        )

                        .academicYear(
                                request.getAcademicYear()
                        )

                        .status(
                                BonafideStatus.DRAFT
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .updatedAt(
                                LocalDateTime.now()
                        )

                        .build();

        BonafideApplication saved =
                applicationRepository.save(application);

        return mapToResponse(saved);
    }


    // =====================================================
    // GET APPLICATION
    // =====================================================

    @Override
    public BonafideApplicationResponseDto getById(
            Long id) {

        BonafideApplication application =
                getApplication(id);

        requireStudentOwner(application);

        return mapToResponse(application);
    }

        @Override
        public BonafideStatusResponseDto getStatus(Long id) {
                BonafideApplication application = getApplication(id);
                requireStudentOwner(application);

                return new BonafideStatusResponseDto(
                                application.getId(),
                                application.getStatus().name(),
                                application.getRejectionReason(),
                                application.getCreatedAt(),
                                application.getUpdatedAt()
                );
        }


    // =====================================================
    // STUDENT MY APPLICATIONS
    // =====================================================

    @Override
    public List<BonafideApplicationResponseDto>
    getMyApplications() {

        User student =
                currentUserService.getCurrentUser();

        return applicationRepository
                .findByStudentId(student.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }


    // =====================================================
    // SUBMIT
    // =====================================================

    @Override
    public void submit(Long id) {

        User student =
                currentUserService.getCurrentUser();

        BonafideApplication application =
                getApplication(id);

        if (!application
                .getStudent()
                .getId()
                .equals(student.getId())) {

            throw new BadRequestException(
                    "You cannot submit another student's application"
            );
        }

        if (!(application.getStatus()
                == BonafideStatus.DRAFT
                ||
                application.getStatus()
                        == BonafideStatus.DSW_REJECTED
                ||
                application.getStatus()
                        == BonafideStatus.PRINCIPAL_REJECTED)) {

            throw new BadRequestException(
                    "Application cannot be submitted in current status"
            );
        }

        application.setStatus(
                BonafideStatus.PENDING_DSW
        );

        application.setRejectionReason(null);

        application.setUpdatedAt(
                LocalDateTime.now()
        );

        applicationRepository.save(application);

        addHistory(
                application,
                student.getId(),
                "STUDENT",
                "SUBMITTED",
                "Bonafide application submitted"
        );
    }



// =====================================================
// DSW PENDING
// =====================================================

@Override
public List<BonafideApplicationResponseDto>
getPendingForDsw() {

    return applicationRepository
            .findByStatus(
                    BonafideStatus.PENDING_DSW
            )
            .stream()
            .map(this::mapToResponse)
            .toList();
}

@Override
public BonafideApplicationResponseDto getDswApplicationById(Long id) {
    return mapToResponse(getApplication(id));
}


    // =====================================================
    // DSW APPROVE
    // =====================================================

    @Override
    public void approveByDsw(Long id) {

        User dsw = currentUserService.getCurrentUser();
        approveByDsw(id, dsw.getEmail(), null);
    }

    @Override
    public BonafideApplicationResponseDto approveByDsw(
            Long applicationId,
            String dswEmail,
            String remarks) {

        User dsw = currentUserService.getCurrentUser();
        if (dswEmail == null || !dsw.getEmail().equalsIgnoreCase(dswEmail)) {
            throw new BadRequestException(
                    "DSW email must match the authenticated account"
            );
        }

        BonafideApplication application =
                getApplication(applicationId);

        if (application.getStatus()
                != BonafideStatus.PENDING_DSW) {

            throw new BadRequestException(
                    "Only pending DSW applications can be approved by DSW"
            );
        }

        application.setStatus(
                BonafideStatus.PENDING_PRINCIPAL
        );

        application.setUpdatedAt(
                LocalDateTime.now()
        );

        applicationRepository.save(application);

        addHistory(
                application,
                dsw.getId(),
                "DSW",
                "APPROVED",
                remarks == null || remarks.isBlank()
                        ? "Application verified and approved by DSW"
                        : remarks.trim()
        );

        return mapToResponse(application);
    }


    // =====================================================
    // DSW REJECT
    // =====================================================

    @Override
    public void rejectByDsw(
            Long id,
            RejectBonafideRequestDto request) {

        BonafideApplication application =
                getApplication(id);

        if (application.getStatus()
                != BonafideStatus.PENDING_DSW) {

            throw new BadRequestException(
                    "Only pending DSW applications can be rejected by DSW"
            );
        }

        application.setStatus(
                BonafideStatus.DSW_REJECTED
        );

        application.setRejectionReason(
                request.getReason()
        );

        application.setUpdatedAt(
                LocalDateTime.now()
        );

        applicationRepository.save(application);

        User dsw =
                currentUserService.getCurrentUser();

        addHistory(
                application,
                dsw.getId(),
                "DSW",
                "REJECTED",
                request.getReason()
        );
    }


    // =====================================================
    // PRINCIPAL PENDING
    // =====================================================

    @Override
    public List<BonafideApplicationResponseDto>
    getPendingForPrincipal() {

        return applicationRepository
                .findByStatus(
                        BonafideStatus.PENDING_PRINCIPAL
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }


    // =====================================================
    // PRINCIPAL APPROVE
    // =====================================================

    @Override
    public void approveByPrincipal(Long id) {

        BonafideApplication application =
                getApplication(id);

        // DSW approval should set status to PENDING_PRINCIPAL, so principal can approve now
        if (application.getStatus()
                != BonafideStatus.PENDING_PRINCIPAL) {

            throw new BadRequestException(
                    "Application must be DSW approved first"
            );
        }

        // Generate certificate
        certificateGenerationService.generate(application);

        // Update status to indicate certificate generated
        application.setStatus(
                BonafideStatus.CERTIFICATE_GENERATED
        );

        application.setUpdatedAt(
                LocalDateTime.now()
        );

        applicationRepository.save(application);

        User principal =
                currentUserService.getCurrentUser();

        addHistory(
                application,
                principal.getId(),
                "PRINCIPAL",
                "APPROVED",
                "Application approved and certificate generated"
        );
    }


    // =====================================================
    // PRINCIPAL REJECT
    // =====================================================

    @Override
    public void rejectByPrincipal(
            Long id,
            RejectBonafideRequestDto request) {

        BonafideApplication application =
                getApplication(id);

        // Principal can reject only after DSW has approved (status PENDING_PRINCIPAL)
        if (application.getStatus()
                != BonafideStatus.PENDING_PRINCIPAL) {

            throw new BadRequestException(
                    "Application must be DSW approved first"
            );
        }

        application.setStatus(
                BonafideStatus.PRINCIPAL_REJECTED
        );

        application.setRejectionReason(
                request.getReason()
        );

        application.setUpdatedAt(
                LocalDateTime.now()
        );

        applicationRepository.save(application);

        User principal =
                currentUserService.getCurrentUser();

        addHistory(
                application,
                principal.getId(),
                "PRINCIPAL",
                "REJECTED",
                request.getReason()
        );
    }

    @Override
    public List<BonafideApplicationResponseDto> getApplicationsForDsw() {
        return getPendingForDsw();
    }

    // =====================================================
    // DOWNLOAD CERTIFICATE
    // =====================================================

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadCertificate(Long id) {

        BonafideApplication application =
                getApplication(id);

        requireStudentOwner(application);

        if (application.getStatus() != BonafideStatus.PRINCIPAL_APPROVED
                && application.getStatus() != BonafideStatus.CERTIFICATE_GENERATED) {

            throw new BadRequestException(
                    "Certificate is not available yet"
            );
        }

        GeneratedCertificate certificate =
                certificateRepository
                        .findByApplicationId(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Certificate not found"
                                )
                        );

        try {

            return fileStorageService.readFile(
                    certificate.getFilePath()
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Unable to read certificate",
                    e
            );
        }
    }


    // =====================================================
    // HELPERS
    // =====================================================

    private BonafideApplication getApplication(
            Long id) {

        return applicationRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Bonafide application not found: "
                                        + id
                        )
                );
    }

    private void requireStudentOwner(BonafideApplication application) {
        User student = currentUserService.getCurrentUser();
        if (!application.getStudent().getId().equals(student.getId())) {
            throw new BadRequestException(
                    "You cannot access another student's application"
            );
        }
    }


    private void addHistory(
            BonafideApplication application,
            Long userId,
            String role,
            String action,
            String remarks) {

        BonafideApprovalHistory history =
                BonafideApprovalHistory.builder()
                        .application(application)
                        .actionBy(userId)
                        .actionByRole(role)
                        .action(action)
                        .remarks(remarks)
                        .actionAt(
                                LocalDateTime.now()
                        )
                        .build();

        historyRepository.save(history);
    }


    private BonafideApplicationResponseDto
    mapToResponse(
            BonafideApplication application) {

        User student =
                application.getStudent();

        return BonafideApplicationResponseDto
                .builder()
                .id(application.getId())
                .studentId(student.getId())
                .studentName(student.getFullName())
                .studentEmail(student.getEmail())
                .rollNumber(student.getRollNumber())
                .department(student.getDepartment())
                .semester(student.getSemester())
                .phoneNumber(
                        application.getPhoneNumber()
                )
                .hostelName(
                        application.getHostelName()
                )
                .roomNumber(
                        application.getRoomNumber()
                )
                .reason(
                        application.getReason()
                )
                .parentName(
                        application.getParentName()
                )
                .hostelAdmissionDate(
                        application.getHostelAdmissionDate()
                )
                .collegeAdmissionDate(
                        application.getCollegeAdmissionDate()
                )
                .academicYear(
                        application.getAcademicYear()
                )
                .status(
                        application.getStatus().name()
                )
                .rejectionReason(
                        application.getRejectionReason()
                )
                .createdAt(
                        application.getCreatedAt()
                )
                .updatedAt(
                        application.getUpdatedAt()
                )
                .build();
    }
}

































































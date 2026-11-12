package com.semesterRegistration.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.semesterRegistration.dto.RegistrationDocumentResponse;
import com.semesterRegistration.dto.RegistrationFeeRequest;
import com.semesterRegistration.dto.RegistrationReviewRequest;
import com.semesterRegistration.dto.RegistrationReviewListItem;
import com.semesterRegistration.dto.RegistrationReviewSummary;
import com.semesterRegistration.dto.RegistrationReviewResponse;
import com.semesterRegistration.dto.SemesterRegistrationResponse;
import com.semesterRegistration.dto.SubmitRegistrationRequest;
import com.semesterRegistration.dto.SubjectSelectionRequest;
import com.semesterRegistration.entity.RegistrationDocument;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.enums.ReviewRole;
import com.semesterRegistration.enums.ReviewTab;
import com.semesterRegistration.enums.ReviewViewer;
import com.semesterRegistration.service.RegistrationDocumentService;
import com.semesterRegistration.service.RegistrationReviewService;
import com.semesterRegistration.service.SemesterRegistrationService;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/semester-registration")
public class SemesterRegistrationController {

    private final SemesterRegistrationService registrationService;
    private final RegistrationDocumentService documentService;
    private final RegistrationReviewService reviewService;
    private final UserRepository userRepository;

    public SemesterRegistrationController(
            SemesterRegistrationService registrationService,
            RegistrationDocumentService documentService,
            RegistrationReviewService reviewService,
            UserRepository userRepository
    ) {
        this.registrationService = registrationService;
        this.documentService = documentService;
        this.reviewService = reviewService;
        this.userRepository = userRepository;
    }

    @PostMapping("/drafts")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SemesterRegistrationResponse> createDraft(
            @Valid @RequestBody CreateRegistrationRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        SemesterRegistrationService.DraftResult result =
                registrationService.createOrResumeDraft(
                        principal.getUsername(),
                        request.branchId(),
                        request.academicYear(),
                        request.semester(),
                        request.section(),
                        request.hostelName(),
                        request.hostelRoom()
                );

        HttpStatus status = result.created()
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity.status(status).body(toResponse(result.registration()));
    }

    @GetMapping("/students/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SemesterRegistrationResponse>>
    getMyRegistrations(
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(registrationService.toResponses(
                registrationService.getStudentRegistrations(
                        principal.getUsername()
                )
        ));
    }

    @GetMapping("/reviews/pending")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'DSW')")
    public ResponseEntity<List<SemesterRegistrationResponse>> getPendingReviews(
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(registrationService.toResponses(
                reviewService.getPendingRegistrations(
                        reviewerRole(principal.getUsername())
                )
        ));
    }

    @GetMapping("/reviews/history")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'DSW')")
    public ResponseEntity<List<SemesterRegistrationResponse>> getReviewHistory(
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(registrationService.toResponses(
                reviewService.getCompletedRegistrations(
                        reviewerRole(principal.getUsername())
                )
        ));
    }

    @GetMapping("/reviews")
    @PreAuthorize("hasAnyRole('LIBRARIAN','DSW','PRINCIPAL')")
    public ResponseEntity<List<RegistrationReviewListItem>> getReviewList(
            @RequestParam(defaultValue = "PENDING") String status,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(reviewService.getReviewList(
                viewerOf(principal),
                ReviewTab.parse(status)
        ));
    }

    @GetMapping("/reviews/summary")
    @PreAuthorize("hasAnyRole('LIBRARIAN','DSW','PRINCIPAL')")
    public ResponseEntity<RegistrationReviewSummary> getReviewSummary(
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(
                reviewService.getReviewSummary(viewerOf(principal))
        );
    }

    @GetMapping("/students/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'BRANCH_STAFF')")
    public ResponseEntity<List<SemesterRegistrationResponse>>
    getStudentRegistrations(
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(registrationService.toResponses(
                registrationService.getStudentRegistrations(
                        studentId,
                        principal.getUsername()
                )
        ));
    }

    @GetMapping("/applications/{registrationId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'BRANCH_STAFF', 'LIBRARIAN', 'DSW', 'PRINCIPAL')")
    public ResponseEntity<SemesterRegistrationResponse> getRegistration(
            @PathVariable Long registrationId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(toResponse(
                registrationService.getRegistrationById(
                        registrationId,
                        principal.getUsername()
                )
        ));
    }

    @GetMapping("/applications/{registrationId}/review-history")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'LIBRARIAN', 'DSW', 'PRINCIPAL')")
    public ResponseEntity<List<RegistrationReviewResponse>> getApplicationReviews(
            @PathVariable Long registrationId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        registrationService.getRegistrationById(
                registrationId,
                principal.getUsername()
        );
        return ResponseEntity.ok(
                reviewService.getReviewHistoryResponse(registrationId)
        );
    }

    @PutMapping("/applications/{registrationId}/details")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SemesterRegistrationResponse> updateDetails(
            @PathVariable Long registrationId,
            @Valid @RequestBody UpdateRegistrationRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(toResponse(
                registrationService.updateDraftDetails(
                        principal.getUsername(),
                        registrationId,
                        request.branchId(),
                        request.academicYear(),
                        request.semester(),
                        request.section(),
                        request.hostelName(),
                        request.hostelRoom()
                )
        ));
    }

    @PutMapping("/applications/{registrationId}/subjects")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SemesterRegistrationResponse> saveSubjects(
            @PathVariable Long registrationId,
            @Valid @RequestBody SubjectSelectionRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(toResponse(
                registrationService.saveSubjects(
                        principal.getUsername(),
                        registrationId,
                        request.subjectIds()
                )
        ));
    }

    @PutMapping("/applications/{registrationId}/fees")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SemesterRegistrationResponse> saveFees(
            @PathVariable Long registrationId,
            @Valid @RequestBody RegistrationFeeRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(toResponse(
                registrationService.saveFees(
                        principal.getUsername(),
                        registrationId,
                        request
                )
        ));
    }

    @PostMapping("/applications/{registrationId}/documents")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RegistrationDocumentResponse> uploadDocument(
            @PathVariable Long registrationId,
            @RequestParam("documentType")
            RegistrationDocument.DocumentType documentType,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                documentService.upload(
                        principal.getUsername(),
                        registrationId,
                        documentType,
                        file
                )
        );
    }

    @GetMapping("/applications/{registrationId}/documents")
    @PreAuthorize("hasAnyRole('STUDENT', 'LIBRARIAN', 'DSW', 'PRINCIPAL')")
    public ResponseEntity<List<RegistrationDocumentResponse>>
    getDocuments(
            @PathVariable Long registrationId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(
                documentService.getDocuments(
                        principal.getUsername(),
                        registrationId
                )
        );
    }

    @GetMapping(
            "/applications/{registrationId}/documents/{documentId}/content"
    )
    @PreAuthorize("hasAnyRole('STUDENT', 'LIBRARIAN', 'DSW', 'PRINCIPAL')")
    public ResponseEntity<byte[]> getDocumentContent(
            @PathVariable Long registrationId,
            @PathVariable Long documentId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        RegistrationDocumentService.StoredDocument document =
                documentService.getDocument(
                        principal.getUsername(),
                        registrationId,
                        documentId
                );
        return ResponseEntity.ok()
                .contentType(document.contentType())
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + document.fileName()
                                .replace("\"", "")
                                .replace("\r", "")
                                .replace("\n", "") + "\""
                )
                .body(document.content());
    }

    @PostMapping("/applications/{registrationId}/review")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'DSW')")
    public ResponseEntity<Void> submitReview(
            @PathVariable Long registrationId,
            @Valid @RequestBody RegistrationReviewRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        User reviewer = findReviewer(principal.getUsername());
        reviewService.submitReview(
                registrationId,
                reviewer.getId(),
                reviewerRole(reviewer),
                request.decision(),
                request.comments()
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/applications/{registrationId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SemesterRegistrationResponse> submit(
            @PathVariable Long registrationId,
            @Valid @RequestBody SubmitRegistrationRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(toResponse(
                registrationService.submit(
                        principal.getUsername(),
                        registrationId,
                        request
                )
        ));
    }

    private SemesterRegistrationResponse toResponse(
            SemesterRegistration registration
    ) {
        return registrationService.toResponse(registration);
    }

    private ReviewRole reviewerRole(String email) {
        return reviewerRole(findReviewer(email));
    }

    private ReviewViewer viewerOf(UserDetails principal) {
        if (principal != null) {
            for (var authority : principal.getAuthorities()) {
                switch (authority.getAuthority()) {
                    case "ROLE_LIBRARIAN":
                        return ReviewViewer.LIBRARIAN;
                    case "ROLE_DSW":
                        return ReviewViewer.DSW;
                    case "ROLE_PRINCIPAL":
                        return ReviewViewer.PRINCIPAL;
                    default:
                        break;
                }
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private User findReviewer(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.web.server
                        .ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated reviewer account was not found."
                ));
    }

    private ReviewRole reviewerRole(User reviewer) {
        if (reviewer.getRole() == Role.LIBRARIAN) {
            return ReviewRole.LIBRARIAN;
        }
        if (reviewer.getRole() == Role.DSW) {
            return ReviewRole.DSW;
        }
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "This account cannot review semester registrations."
        );
    }

    public record CreateRegistrationRequest(
            @JsonProperty("studentId")
            Long ignoredStudentId,
            @NotNull(message = "Branch is required.")
            Long branchId,
            @NotBlank(message = "Academic year is required.")
            String academicYear,
            @NotNull(message = "Semester is required.")
            @Min(value = 1, message = "Semester must be between 1 and 10.")
            @Max(value = 10, message = "Semester must be between 1 and 10.")
            Integer semester,
            @NotBlank(message = "Section is required.")
            @Size(max = 20, message = "Section cannot exceed 20 characters.")
            String section,
            @Size(max = 100, message = "Hostel name cannot exceed 100 characters.")
            String hostelName,
            @Size(max = 30, message = "Hostel room cannot exceed 30 characters.")
            String hostelRoom
    ) {
    }

    public record UpdateRegistrationRequest(
            @NotNull(message = "Branch is required.")
            Long branchId,
            @NotBlank(message = "Academic year is required.")
            String academicYear,
            @NotNull(message = "Semester is required.")
            @Min(value = 1, message = "Semester must be between 1 and 10.")
            @Max(value = 10, message = "Semester must be between 1 and 10.")
            Integer semester,
            @NotBlank(message = "Section is required.")
            @Size(max = 20, message = "Section cannot exceed 20 characters.")
            String section,
            @Size(max = 100, message = "Hostel name cannot exceed 100 characters.")
            String hostelName,
            @Size(max = 30, message = "Hostel room cannot exceed 30 characters.")
            String hostelRoom
    ) {
    }
}

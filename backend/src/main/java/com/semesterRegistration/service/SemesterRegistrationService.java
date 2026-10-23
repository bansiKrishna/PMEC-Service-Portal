package com.semesterRegistration.service;

import com.semesterRegistration.dto.RegistrationFeeRequest;
import com.semesterRegistration.dto.SemesterRegistrationResponse;
import com.semesterRegistration.dto.SubmitRegistrationRequest;
import com.semesterRegistration.entity.AcademicSubject;
import com.semesterRegistration.entity.Branch;
import com.semesterRegistration.entity.RegistrationDocument;
import com.semesterRegistration.entity.RegistrationDocument.DocumentType;
import com.semesterRegistration.entity.RegistrationSubject;
import com.semesterRegistration.entity.RegistrationReview;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.enums.RegistrationStatus;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewRole;
import com.semesterRegistration.repository.AcademicSubjectRepository;
import com.semesterRegistration.repository.BranchRepository;
import com.semesterRegistration.repository.BranchStaffAssignmentRepository;
import com.semesterRegistration.repository.RegistrationDocumentRepository;
import com.semesterRegistration.repository.RegistrationReviewRepository;
import com.semesterRegistration.repository.RegistrationSubjectRepository;
import com.semesterRegistration.repository.SemesterRegistrationRepository;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SemesterRegistrationService {

    private final SemesterRegistrationRepository registrationRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final AcademicSubjectRepository subjectRepository;
    private final RegistrationSubjectRepository registrationSubjectRepository;
    private final RegistrationDocumentRepository documentRepository;
    private final RegistrationReviewRepository reviewRepository;
    private final BranchStaffAssignmentRepository branchStaffAssignmentRepository;

    public SemesterRegistrationService(
            SemesterRegistrationRepository registrationRepository,
            BranchRepository branchRepository,
            UserRepository userRepository,
            AcademicSubjectRepository subjectRepository,
            RegistrationSubjectRepository registrationSubjectRepository,
            RegistrationDocumentRepository documentRepository,
            RegistrationReviewRepository reviewRepository,
            BranchStaffAssignmentRepository branchStaffAssignmentRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.registrationSubjectRepository = registrationSubjectRepository;
        this.documentRepository = documentRepository;
        this.reviewRepository = reviewRepository;
        this.branchStaffAssignmentRepository = branchStaffAssignmentRepository;
    }

    @Transactional
    public DraftResult createOrResumeDraft(
            String authenticatedEmail,
            Long branchId,
            String academicYear,
            Integer semester,
            String section,
            String hostelName,
            String hostelRoom
    ) {
        User student = requireStudent(authenticatedEmail);
        String normalizedYear = validateAcademicDetails(
                branchId,
                academicYear,
                semester,
                section
        );

        var existing = registrationRepository
                .findByStudent_IdAndAcademicYearAndSemester(
                        student.getId(),
                        normalizedYear,
                        semester
                );
        if (existing.isPresent()) {
            SemesterRegistration registration = existing.get();
            if (!isEditable(registration.getStatus())) {
                throw conflict(
                        "A registration for this academic year and semester "
                                + "has already been submitted."
                );
            }
            return new DraftResult(registration, false);
        }

        Branch branch = requireActiveBranch(branchId);
        SemesterRegistration registration = SemesterRegistration.builder()
                .applicationNumber(
                        "SEM-" + UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase()
                )
                .student(student)
                .branch(branch)
                .academicYear(normalizedYear)
                .semester(semester)
                .section(section.trim())
                .hostelName(normalizeOptional(hostelName))
                .hostelRoom(normalizeOptional(hostelRoom))
                .status(RegistrationStatus.DRAFT)
                .build();

        try {
            return new DraftResult(
                    registrationRepository.saveAndFlush(registration),
                    true
            );
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw conflict(
                    "A registration already exists for this student, "
                            + "academic year, and semester."
            );
        }
    }

    @Transactional(readOnly = true)
    public List<SemesterRegistration> getStudentRegistrations(
            String authenticatedEmail
    ) {
        User student = requireStudent(authenticatedEmail);
        return registrationRepository
                .findByStudent_IdOrderByCreatedAtDesc(student.getId());
    }

    @Transactional(readOnly = true)
    public List<SemesterRegistration> getStudentRegistrations(
            Long studentId,
            String authenticatedEmail
    ) {
        User currentUser = requireUser(authenticatedEmail);
        if (currentUser.getRole() == Role.STUDENT
                && !currentUser.getId().equals(studentId)) {
            throw notFound("Student registrations were not found.");
        }

        if (!userRepository.existsById(studentId)) {
            throw notFound("Student not found.");
        }

        if (currentUser.getRole() == Role.BRANCH_STAFF) {
            return branchStaffAssignmentRepository
                    .findByUser_IdAndActiveTrue(currentUser.getId())
                    .stream()
                    .flatMap(assignment ->
                            registrationRepository
                                    .findByStudent_IdAndBranch_IdOrderByCreatedAtDesc(
                                            studentId,
                                            assignment.getBranch().getId()
                                    )
                                    .stream()
                    )
                    .toList();
        }

        return registrationRepository.findByStudent_IdOrderByCreatedAtDesc(studentId);
    }

    @Transactional(readOnly = true)
    public SemesterRegistration getRegistrationById(
            Long registrationId,
            String authenticatedEmail
    ) {
        User currentUser = requireUser(authenticatedEmail);
        SemesterRegistration registration = requireRegistration(registrationId);
        if (currentUser.getRole() == Role.STUDENT
                && !registration.getStudent().getId()
                        .equals(currentUser.getId())) {
            throw notFound("Registration not found.");
        }
        if (currentUser.getRole() == Role.BRANCH_STAFF
                && !branchStaffAssignmentRepository
                        .existsByUser_IdAndBranch_IdAndActiveTrue(
                                currentUser.getId(),
                                registration.getBranch().getId()
                        )) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not assigned to this registration's branch."
            );
        }
        return registration;
    }

    @Transactional(readOnly = true)
    public SemesterRegistration getOwnedEditableRegistration(
            String authenticatedEmail,
            Long registrationId
    ) {
        User student = requireStudent(authenticatedEmail);
        return requireEditableRegistration(registrationId, student);
    }

    @Transactional(readOnly = true)
    public SemesterRegistration getOwnedRegistration(
            String authenticatedEmail,
            Long registrationId
    ) {
        User student = requireStudent(authenticatedEmail);
        SemesterRegistration registration = requireRegistration(registrationId);
        requireOwner(registration, student);
        return registration;
    }

    @Transactional
    public SemesterRegistration updateDraftDetails(
            String authenticatedEmail,
            Long registrationId,
            Long branchId,
            String academicYear,
            Integer semester,
            String section,
            String hostelName,
            String hostelRoom
    ) {
        User student = requireStudent(authenticatedEmail);
        SemesterRegistration registration =
                requireEditableRegistration(registrationId, student);
        String normalizedYear = validateAcademicDetails(
                branchId,
                academicYear,
                semester,
                section
        );
        registrationRepository
                .findByStudent_IdAndAcademicYearAndSemester(
                        student.getId(),
                        normalizedYear,
                        semester
                )
                .filter(existing -> !existing.getId().equals(registrationId))
                .ifPresent(existing -> {
                    throw conflict(
                            "A registration already exists for this student, "
                                    + "academic year, and semester."
                    );
                });

        registration.setBranch(requireActiveBranch(branchId));
        registration.setAcademicYear(normalizedYear);
        registration.setSemester(semester);
        registration.setSection(section.trim());
        registration.setHostelName(normalizeOptional(hostelName));
        registration.setHostelRoom(normalizeOptional(hostelRoom));
        return registrationRepository.save(registration);
    }

    @Transactional
    public SemesterRegistration saveSubjects(
            String authenticatedEmail,
            Long registrationId,
            List<Long> subjectIds
    ) {
        User student = requireStudent(authenticatedEmail);
        SemesterRegistration registration =
                requireEditableRegistration(registrationId, student);
        replaceSubjects(registration, subjectIds, false);
        return registration;
    }

    @Transactional
    public SemesterRegistration saveFees(
            String authenticatedEmail,
            Long registrationId,
            RegistrationFeeRequest fees
    ) {
        User student = requireStudent(authenticatedEmail);
        SemesterRegistration registration =
                requireEditableRegistration(registrationId, student);
        validateFees(fees);

        registration.setCollegeFeeDue(fees.collegeFeeDue());
        registration.setCollegeFeePaid(fees.collegeFeePaid());
        registration.setCollegeAdvance(fees.collegeAdvance());
        registration.setHostelFeeDue(fees.hostelFeeDue());
        registration.setHostelFeePaid(fees.hostelFeePaid());
        registration.setHostelAdvance(fees.hostelAdvance());
        registration.setMessFeeDue(fees.messFeeDue());
        registration.setMessFeePaid(fees.messFeePaid());
        registration.setMessAdvance(fees.messAdvance());
        return registrationRepository.save(registration);
    }

    @Transactional
    public SemesterRegistration submit(
            String authenticatedEmail,
            Long pathRegistrationId,
            SubmitRegistrationRequest request
    ) {
        if (!pathRegistrationId.equals(request.registrationId())) {
            throw badRequest(
                    "The registration ID in the URL and request body must match."
            );
        }
        User student = requireStudent(authenticatedEmail);
        SemesterRegistration registration = registrationRepository
                .findByIdForUpdate(pathRegistrationId)
                .orElseThrow(() -> notFound("Registration not found."));
        requireOwner(registration, student);
        requireEditableStatus(registration);

        validateSavedFees(registration);
        requireReceiptIfPaid(
                registration,
                DocumentType.COLLEGE_FEE_RECEIPT,
                registration.getCollegeFeePaid(),
                registration.getCollegeAdvance(),
                "college"
        );
        requireReceiptIfPaid(
                registration,
                DocumentType.HOSTEL_FEE_RECEIPT,
                registration.getHostelFeePaid(),
                registration.getHostelAdvance(),
                "hostel"
        );
        requireReceiptIfPaid(
                registration,
                DocumentType.MESS_FEE_RECEIPT,
                registration.getMessFeePaid(),
                registration.getMessAdvance(),
                "mess"
        );

        replaceSubjects(registration, request.subjectIds(), true);
        initializePendingReview(registration, ReviewRole.LIBRARIAN);
        initializePendingReview(registration, ReviewRole.DSW);
        registration.setStatus(RegistrationStatus.SUBMITTED);
        registration.setSubmittedAt(LocalDateTime.now());
        return registrationRepository.save(registration);
    }

    @Transactional(readOnly = true)
    public SemesterRegistrationResponse toResponse(
            SemesterRegistration registration
    ) {
        SemesterRegistration managedRegistration =
                requireRegistration(registration.getId());
        return SemesterRegistrationResponse.from(
                managedRegistration,
                registrationSubjectRepository,
                documentRepository
        );
    }

    @Transactional(readOnly = true)
    public List<SemesterRegistrationResponse> toResponses(
            List<SemesterRegistration> registrations
    ) {
        if (registrations.isEmpty()) {
            return List.of();
        }

        List<Long> registrationIds = registrations.stream()
                .map(SemesterRegistration::getId)
                .toList();
        Map<Long, SemesterRegistration> registrationsById =
                registrationRepository.findByIdIn(registrationIds).stream()
                        .collect(Collectors.toMap(
                                SemesterRegistration::getId,
                                Function.identity()
                        ));
        Map<Long, List<RegistrationSubject>> subjectsByRegistration =
                registrationSubjectRepository
                        .findByRegistration_IdInOrderBySubject_CodeAsc(
                                registrationIds
                        )
                        .stream()
                        .collect(Collectors.groupingBy(
                                link -> link.getRegistration().getId()
                        ));
        Map<Long, List<RegistrationDocument>> documentsByRegistration =
                documentRepository
                        .findByRegistration_IdInOrderByUploadedAtDesc(
                                registrationIds
                        )
                        .stream()
                        .collect(Collectors.groupingBy(
                                document -> document.getRegistration().getId()
                        ));

        return registrationIds.stream()
                .map(registrationId -> SemesterRegistrationResponse.from(
                        registrationsById.get(registrationId),
                        subjectsByRegistration.getOrDefault(
                                registrationId,
                                List.of()
                        ),
                        documentsByRegistration.getOrDefault(
                                registrationId,
                                List.of()
                        )
                ))
                .toList();
    }

    private void replaceSubjects(
            SemesterRegistration registration,
            List<Long> subjectIds,
            boolean requireCompulsory
    ) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            throw badRequest("Select at least one subject.");
        }
        Set<Long> uniqueIds = new HashSet<>(subjectIds);
        if (uniqueIds.size() != subjectIds.size()) {
            throw badRequest("A subject cannot be selected more than once.");
        }

        List<AcademicSubject> subjects =
                subjectRepository.findAllById(uniqueIds);
        if (subjects.size() != uniqueIds.size()) {
            throw badRequest("One or more selected subjects do not exist.");
        }

        for (AcademicSubject subject : subjects) {
            if (!subject.isActive()
                    || !subject.getBranch().getId()
                            .equals(registration.getBranch().getId())
                    || !subject.getAcademicYear()
                            .equals(registration.getAcademicYear())
                    || !subject.getSemester()
                            .equals(registration.getSemester())) {
                throw badRequest(
                        "Selected subjects must be active and belong to this "
                                + "registration's branch, academic year, and semester."
                );
            }
        }

        if (requireCompulsory) {
            Set<Long> selectedIds = subjects.stream()
                    .map(AcademicSubject::getId)
                    .collect(java.util.stream.Collectors.toSet());
            List<AcademicSubject> availableSubjects = subjectRepository
                    .findByBranch_IdAndAcademicYearAndSemesterAndActiveTrueOrderByCodeAsc(
                            registration.getBranch().getId(),
                            registration.getAcademicYear(),
                            registration.getSemester()
                    );
            boolean missingCompulsory = availableSubjects.stream()
                    .anyMatch(subject ->
                            subject.isCompulsory()
                                    && !selectedIds.contains(subject.getId())
                    );
            if (missingCompulsory) {
                throw badRequest(
                        "Select all compulsory subjects before submitting."
                );
            }
        }

        registrationSubjectRepository.deleteByRegistrationId(
                registration.getId()
        );
        registrationSubjectRepository.saveAllAndFlush(
                subjects.stream()
                        .map(subject -> RegistrationSubject.builder()
                                .registration(registration)
                                .subject(subject)
                                .build())
                        .toList()
        );
    }

    private void initializePendingReview(
            SemesterRegistration registration,
            ReviewRole reviewerRole
    ) {
        RegistrationReview latestReview = reviewRepository
                .findFirstByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc(
                        registration.getId(),
                        reviewerRole
                )
                .orElse(null);
        if (latestReview != null
                && latestReview.getDecision() == ReviewDecision.PENDING) {
            return;
        }

        reviewRepository.save(RegistrationReview.builder()
                .registration(registration)
                .reviewerRole(reviewerRole)
                .decision(ReviewDecision.PENDING)
                .build());
    }

    private void validateSavedFees(SemesterRegistration registration) {
        List<BigDecimal> amounts = java.util.Arrays.asList(
                registration.getCollegeFeeDue(),
                registration.getCollegeFeePaid(),
                registration.getCollegeAdvance(),
                registration.getHostelFeeDue(),
                registration.getHostelFeePaid(),
                registration.getHostelAdvance(),
                registration.getMessFeeDue(),
                registration.getMessFeePaid(),
                registration.getMessAdvance()
        );
        if (amounts.stream().anyMatch(amount ->
                amount == null || amount.compareTo(BigDecimal.ZERO) < 0)) {
            throw badRequest("Fee details are required before submission.");
        }
    }

    private void validateFees(RegistrationFeeRequest fees) {
        if (fees == null) {
            throw badRequest("Fee details are required.");
        }
        List<BigDecimal> amounts = java.util.Arrays.asList(
                fees.collegeFeeDue(),
                fees.collegeFeePaid(),
                fees.collegeAdvance(),
                fees.hostelFeeDue(),
                fees.hostelFeePaid(),
                fees.hostelAdvance(),
                fees.messFeeDue(),
                fees.messFeePaid(),
                fees.messAdvance()
        );
        if (amounts.stream().anyMatch(amount ->
                amount == null || amount.compareTo(BigDecimal.ZERO) < 0)) {
            throw badRequest(
                    "All fee amounts are required and must be non-negative."
            );
        }
    }

    private void requireReceiptIfPaid(
            SemesterRegistration registration,
            DocumentType type,
            BigDecimal paid,
            BigDecimal advance,
            String category
    ) {
        if (paid.add(advance).compareTo(BigDecimal.ZERO) > 0
                && !documentRepository.existsByRegistration_IdAndDocumentType(
                        registration.getId(),
                        type
                )) {
            throw badRequest(
                    "Upload a " + category + " fee receipt when a payment "
                            + "or advance has been entered."
            );
        }
    }

    private String validateAcademicDetails(
            Long branchId,
            String academicYear,
            Integer semester,
            String section
    ) {
        requireActiveBranch(branchId);
        if (academicYear == null
                || !academicYear.trim().matches("\\d{4}-\\d{4}")) {
            throw badRequest(
                    "Academic year must use the format YYYY-YYYY."
            );
        }
        String normalizedYear = academicYear.trim();
        String[] years = normalizedYear.split("-");
        if (Integer.parseInt(years[1])
                != Integer.parseInt(years[0]) + 1) {
            throw badRequest(
                    "The academic year must cover consecutive years."
            );
        }
        if (semester == null || semester < 1 || semester > 10) {
            throw badRequest("Semester must be between 1 and 10.");
        }
        if (section == null || section.isBlank()) {
            throw badRequest("Section is required.");
        }
        return normalizedYear;
    }

    private Branch requireActiveBranch(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> notFound("Branch not found."));
        if (!branch.isActive()) {
            throw badRequest("Cannot register under an inactive branch.");
        }
        return branch;
    }

    private User requireStudent(String authenticatedEmail) {
        User user = requireUser(authenticatedEmail);
        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only authenticated students may modify their registration."
            );
        }
        return user;
    }

    private User requireUser(String authenticatedEmail) {
        if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "An authenticated user is required."
            );
        }
        return userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> notFound("Authenticated user not found."));
    }

    private SemesterRegistration requireEditableRegistration(
            Long registrationId,
            User student
    ) {
        SemesterRegistration registration = requireRegistration(registrationId);
        requireOwner(registration, student);
        requireEditableStatus(registration);
        return registration;
    }

    private SemesterRegistration requireRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> notFound("Registration not found."));
    }

    private void requireOwner(
            SemesterRegistration registration,
            User student
    ) {
        if (!registration.getStudent().getId().equals(student.getId())) {
            throw notFound("Registration not found.");
        }
    }

    private void requireEditableStatus(SemesterRegistration registration) {
        if (!isEditable(registration.getStatus())) {
            throw conflict(
                    "Only draft or revision-required registrations may be changed."
            );
        }
    }

    private boolean isEditable(RegistrationStatus status) {
        return status == RegistrationStatus.DRAFT
                || status == RegistrationStatus.REVISION_REQUIRED;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    public record DraftResult(
            SemesterRegistration registration,
            boolean created
    ) {
    }
}

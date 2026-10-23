package com.semesterRegistration.service;

import com.semesterRegistration.dto.RegistrationFeeRequest;
import com.semesterRegistration.dto.SubmitRegistrationRequest;
import com.semesterRegistration.entity.AcademicSubject;
import com.semesterRegistration.entity.Branch;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.enums.RegistrationStatus;
import com.semesterRegistration.repository.AcademicSubjectRepository;
import com.semesterRegistration.repository.BranchRepository;
import com.semesterRegistration.repository.RegistrationDocumentRepository;
import com.semesterRegistration.repository.RegistrationReviewRepository;
import com.semesterRegistration.repository.BranchStaffAssignmentRepository;
import com.semesterRegistration.repository.RegistrationSubjectRepository;
import com.semesterRegistration.repository.SemesterRegistrationRepository;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SemesterRegistrationServiceTest {

    private SemesterRegistrationRepository registrationRepository;
    private BranchRepository branchRepository;
    private UserRepository userRepository;
    private AcademicSubjectRepository subjectRepository;
    private RegistrationSubjectRepository registrationSubjectRepository;
    private RegistrationDocumentRepository documentRepository;
    private RegistrationReviewRepository reviewRepository;
    private BranchStaffAssignmentRepository branchStaffAssignmentRepository;
    private SemesterRegistrationService service;

    @BeforeEach
    void setUp() {
        registrationRepository = mock(SemesterRegistrationRepository.class);
        branchRepository = mock(BranchRepository.class);
        userRepository = mock(UserRepository.class);
        subjectRepository = mock(AcademicSubjectRepository.class);
        registrationSubjectRepository =
                mock(RegistrationSubjectRepository.class);
        documentRepository = mock(RegistrationDocumentRepository.class);
        reviewRepository = mock(RegistrationReviewRepository.class);
        branchStaffAssignmentRepository =
                mock(BranchStaffAssignmentRepository.class);
        service = new SemesterRegistrationService(
                registrationRepository,
                branchRepository,
                userRepository,
                subjectRepository,
                registrationSubjectRepository,
                documentRepository,
                reviewRepository,
                branchStaffAssignmentRepository
        );
    }

    @Test
    void createDraftUsesAuthenticatedStudentAndPersistsDetails() {
        User student = student(4L, "student@pmec.ac.in");
        Branch branch = branch(9L);
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(branchRepository.findById(9L)).thenReturn(Optional.of(branch));
        when(registrationRepository
                .findByStudent_IdAndAcademicYearAndSemester(
                        4L, "2026-2027", 5
                ))
                .thenReturn(Optional.empty());
        when(registrationRepository.saveAndFlush(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SemesterRegistrationService.DraftResult result =
                service.createOrResumeDraft(
                        student.getEmail(),
                        9L,
                        "2026-2027",
                        5,
                        "A",
                        "North Hostel",
                        "12"
                );

        assertTrue(result.created());
        assertEquals(student, result.registration().getStudent());
        assertEquals(branch, result.registration().getBranch());
        assertEquals("2026-2027", result.registration().getAcademicYear());
        assertEquals(RegistrationStatus.DRAFT, result.registration().getStatus());
        verify(registrationRepository).saveAndFlush(any());
    }

    @Test
    void createDraftResumesExistingDraftInsteadOfCreatingDuplicate() {
        User student = student(4L, "student@pmec.ac.in");
        SemesterRegistration draft = registration(student, branch(9L));
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(branchRepository.findById(9L))
                .thenReturn(Optional.of(draft.getBranch()));
        when(registrationRepository
                .findByStudent_IdAndAcademicYearAndSemester(
                        4L, "2026-2027", 5
                ))
                .thenReturn(Optional.of(draft));

        SemesterRegistrationService.DraftResult result =
                service.createOrResumeDraft(
                        student.getEmail(),
                        9L,
                        "2026-2027",
                        5,
                        "A",
                        null,
                        null
                );

        assertFalse(result.created());
        assertSame(draft, result.registration());
        verify(registrationRepository, never()).saveAndFlush(any());
    }

    @Test
    void studentCannotReadAnotherStudentsRegistration() {
        User owner = student(4L, "owner@pmec.ac.in");
        User otherStudent = student(5L, "other@pmec.ac.in");
        SemesterRegistration registration = registration(owner, branch(9L));
        when(userRepository.findByEmail(otherStudent.getEmail()))
                .thenReturn(Optional.of(otherStudent));
        when(registrationRepository.findById(12L))
                .thenReturn(Optional.of(registration));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.getRegistrationById(12L, otherStudent.getEmail())
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void submitPersistsSubjectsAndChangesStatusOnlyAfterValidation() {
        User student = student(4L, "student@pmec.ac.in");
        Branch branch = branch(9L);
        SemesterRegistration registration = registration(student, branch);
        AcademicSubject subject = subject(14L, branch, true);
        setZeroFees(registration);
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(registration));
        when(subjectRepository.findAllById(Set.of(14L)))
                .thenReturn(List.of(subject));
        when(subjectRepository
                .findByBranch_IdAndAcademicYearAndSemesterAndActiveTrueOrderByCodeAsc(
                        9L, "2026-2027", 5
                ))
                .thenReturn(List.of(subject));
        when(registrationRepository.save(registration))
                .thenReturn(registration);

        SemesterRegistration submitted = service.submit(
                student.getEmail(),
                12L,
                new SubmitRegistrationRequest(12L, List.of(14L))
        );

        assertEquals(RegistrationStatus.SUBMITTED, submitted.getStatus());
        assertNotNull(submitted.getSubmittedAt());
        verify(registrationSubjectRepository).deleteByRegistrationId(12L);
        verify(registrationSubjectRepository).saveAllAndFlush(anyList());
        verify(reviewRepository, times(2)).save(any());
        verify(registrationRepository).save(registration);
    }

    @Test
    void submitRejectsDuplicateSubjectIdsBeforeReplacingSavedSelections() {
        User student = student(4L, "student@pmec.ac.in");
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(registration(student, branch(9L))));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        student.getEmail(),
                        12L,
                        new SubmitRegistrationRequest(12L, List.of(14L, 14L))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(registrationSubjectRepository, never())
                .deleteByRegistrationId(anyLong());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void branchStaffCannotReadRegistrationOutsideAssignedBranch() {
        User staff = student(8L, "staff@pmec.ac.in");
        staff.setRole(Role.BRANCH_STAFF);
        SemesterRegistration registration = registration(
                student(4L, "student@pmec.ac.in"),
                branch(9L)
        );
        when(userRepository.findByEmail(staff.getEmail()))
                .thenReturn(Optional.of(staff));
        when(registrationRepository.findById(12L))
                .thenReturn(Optional.of(registration));
        when(branchStaffAssignmentRepository
                .existsByUser_IdAndBranch_IdAndActiveTrue(8L, 9L))
                .thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.getRegistrationById(12L, staff.getEmail())
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void submitRejectsSubjectFromAnotherBranchWithoutChangingStatus() {
        User student = student(4L, "student@pmec.ac.nz");
        Branch branch = branch(9L);
        SemesterRegistration registration = registration(student, branch);
        AcademicSubject foreignSubject = subject(14L, branch(10L), true);
        setZeroFees(registration);
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(registration));
        when(subjectRepository.findAllById(Set.of(14L)))
                .thenReturn(List.of(foreignSubject));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        student.getEmail(),
                        12L,
                        new SubmitRegistrationRequest(12L, List.of(14L))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(RegistrationStatus.DRAFT, registration.getStatus());
        verify(registrationSubjectRepository, never())
                .deleteByRegistrationId(anyLong());
        verify(registrationRepository, never()).save(registration);
    }

    @Test
    void submitRejectsUnknownSubjectId() {
        User student = student(4L, "student@pmec.ac.in");
        SemesterRegistration registration = registration(student, branch(9L));
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(registration));
        when(subjectRepository.findAllById(Set.of(777L)))
                .thenReturn(List.of());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        student.getEmail(),
                        12L,
                        new SubmitRegistrationRequest(12L, List.of(777L))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(registrationSubjectRepository, never())
                .deleteByRegistrationId(anyLong());
        verify(registrationRepository, never()).save(registration);
    }

    @Test
    void submitRequiresEveryCompulsorySubject() {
        User student = student(4L, "student@pmec.ac.in");
        Branch branch = branch(9L);
        SemesterRegistration registration = registration(student, branch);
        AcademicSubject compulsorySubject = subject(14L, branch, true);
        AcademicSubject electiveSubject = subject(15L, branch, false);
        setZeroFees(registration);
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(registration));
        when(subjectRepository.findAllById(Set.of(15L)))
                .thenReturn(List.of(electiveSubject));
        when(subjectRepository
                .findByBranch_IdAndAcademicYearAndSemesterAndActiveTrueOrderByCodeAsc(
                        9L, "2026-2027", 5
                ))
                .thenReturn(List.of(compulsorySubject, electiveSubject));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        student.getEmail(),
                        12L,
                        new SubmitRegistrationRequest(12L, List.of(15L))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(RegistrationStatus.DRAFT, registration.getStatus());
        verify(registrationSubjectRepository, never())
                .deleteByRegistrationId(anyLong());
    }

    @Test
    void submitRejectsMissingFeeDetails() {
        User student = student(4L, "student@pmec.ac.in");
        Branch branch = branch(9L);
        SemesterRegistration registration = registration(student, branch);
        AcademicSubject subject = subject(14L, branch, true);
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(registration));
        when(subjectRepository.findAllById(Set.of(14L)))
                .thenReturn(List.of(subject));
        when(subjectRepository
                .findByBranch_IdAndAcademicYearAndSemesterAndActiveTrueOrderByCodeAsc(
                        9L, "2026-2027", 5
                ))
                .thenReturn(List.of(subject));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        student.getEmail(),
                        12L,
                        new SubmitRegistrationRequest(12L, List.of(14L))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(RegistrationStatus.DRAFT, registration.getStatus());
        assertNull(registration.getSubmittedAt());
        verify(registrationRepository, never()).save(registration);
    }

    @Test
    void saveFeesPersistsAllFeeAmounts() {
        User student = student(4L, "student@pmec.ac.in");
        SemesterRegistration registration = registration(student, branch(9L));
        RegistrationFeeRequest fees = new RegistrationFeeRequest(
                BigDecimal.valueOf(1200),
                BigDecimal.valueOf(900),
                BigDecimal.valueOf(50),
                BigDecimal.valueOf(700),
                BigDecimal.valueOf(600),
                BigDecimal.ZERO,
                BigDecimal.valueOf(300),
                BigDecimal.valueOf(250),
                BigDecimal.valueOf(25)
        );
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findById(12L))
                .thenReturn(Optional.of(registration));
        when(registrationRepository.save(registration))
                .thenReturn(registration);

        SemesterRegistration saved = service.saveFees(
                student.getEmail(),
                12L,
                fees
        );

        assertEquals(fees.collegeFeeDue(), saved.getCollegeFeeDue());
        assertEquals(fees.collegeFeePaid(), saved.getCollegeFeePaid());
        assertEquals(fees.collegeAdvance(), saved.getCollegeAdvance());
        assertEquals(fees.hostelFeeDue(), saved.getHostelFeeDue());
        assertEquals(fees.hostelFeePaid(), saved.getHostelFeePaid());
        assertEquals(fees.hostelAdvance(), saved.getHostelAdvance());
        assertEquals(fees.messFeeDue(), saved.getMessFeeDue());
        assertEquals(fees.messFeePaid(), saved.getMessFeePaid());
        assertEquals(fees.messAdvance(), saved.getMessAdvance());
    }

    @Test
    void submitRequiresReceiptForPaidFeeCategory() {
        User student = student(4L, "student@pmec.ac.in");
        Branch branch = branch(9L);
        SemesterRegistration registration = registration(student, branch);
        AcademicSubject subject = subject(14L, branch, true);
        setZeroFees(registration);
        registration.setCollegeFeePaid(BigDecimal.valueOf(250));
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(registration));
        when(subjectRepository.findAllById(Set.of(14L)))
                .thenReturn(List.of(subject));
        when(subjectRepository
                .findByBranch_IdAndAcademicYearAndSemesterAndActiveTrueOrderByCodeAsc(
                        9L, "2026-2027", 5
                ))
                .thenReturn(List.of(subject));
        when(documentRepository.existsByRegistration_IdAndDocumentType(
                12L,
                com.semesterRegistration.entity.RegistrationDocument.DocumentType
                        .COLLEGE_FEE_RECEIPT
        )).thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        student.getEmail(),
                        12L,
                        new SubmitRegistrationRequest(12L, List.of(14L))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals(RegistrationStatus.DRAFT, registration.getStatus());
        assertNull(registration.getSubmittedAt());
        verify(registrationRepository, never()).save(registration);
    }

    @Test
    void repeatedSubmissionIsRejected() {
        User student = student(4L, "student@pmec.ac.in");
        SemesterRegistration submitted = registration(student, branch(9L));
        submitted.setStatus(RegistrationStatus.SUBMITTED);
        when(userRepository.findByEmail(student.getEmail()))
                .thenReturn(Optional.of(student));
        when(registrationRepository.findByIdForUpdate(12L))
                .thenReturn(Optional.of(submitted));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        student.getEmail(),
                        12L,
                        new SubmitRegistrationRequest(12L, List.of(14L))
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(registrationSubjectRepository, never())
                .deleteByRegistrationId(anyLong());
        verify(registrationRepository, never()).save(submitted);
    }

    @Test
    void submitRejectsMismatchedRegistrationId() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(
                        "student@pmec.ac.in",
                        12L,
                        new SubmitRegistrationRequest(13L, List.of(14L))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(registrationRepository, never()).findByIdForUpdate(anyLong());
    }

    private User student(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .role(Role.STUDENT)
                .fullName("Student")
                .build();
    }

    private Branch branch(Long id) {
        return Branch.builder()
                .id(id)
                .code("CSE")
                .name("Computer Science")
                .active(true)
                .build();
    }

    private SemesterRegistration registration(User student, Branch branch) {
        return SemesterRegistration.builder()
                .id(12L)
                .student(student)
                .branch(branch)
                .academicYear("2026-2027")
                .semester(5)
                .section("A")
                .status(RegistrationStatus.DRAFT)
                .build();
    }

    private AcademicSubject subject(
            Long id,
            Branch branch,
            boolean compulsory
    ) {
        return AcademicSubject.builder()
                .id(id)
                .branch(branch)
                .academicYear("2026-2027")
                .semester(5)
                .code("CS501")
                .name("Software Engineering")
                .subjectType(AcademicSubject.SubjectType.THEORY)
                .compulsory(compulsory)
                .active(true)
                .build();
    }

    private void setZeroFees(SemesterRegistration registration) {
        registration.setCollegeFeeDue(BigDecimal.ZERO);
        registration.setCollegeFeePaid(BigDecimal.ZERO);
        registration.setCollegeAdvance(BigDecimal.ZERO);
        registration.setHostelFeeDue(BigDecimal.ZERO);
        registration.setHostelFeePaid(BigDecimal.ZERO);
        registration.setHostelAdvance(BigDecimal.ZERO);
        registration.setMessFeeDue(BigDecimal.ZERO);
        registration.setMessFeePaid(BigDecimal.ZERO);
        registration.setMessAdvance(BigDecimal.ZERO);
    }
}

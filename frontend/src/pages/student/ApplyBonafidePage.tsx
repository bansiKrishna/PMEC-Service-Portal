import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FilePlus2, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { studentApi } from "../../api/studentApi";
import type { BonafideApplicationRequestDto } from "../../types/bonafide";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const btechBranches = [
  "Automobile Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Science & Engineering",
  "Electrical Engineering",
  "Electronics & Telecommunications Engineering",
  "Mechanical Engineering",
  "Metallurgical & Materials Engineering",
];

const mtechSpecializations: Record<string, { name: string; intake: string }[]> =
  {
    "Computer Science & Engineering": [
      { name: "Artificial Intelligence and Machine Learning", intake: "18" },
    ],
    "Electronics & Telecommunication Engineering": [
      { name: "Embedded System and VLSI Design", intake: "18" },
    ],
    "Civil Engineering": [{ name: "Structural Engineering", intake: "18" }],
    "Electrical Engineering": [
      { name: "Power System Engineering", intake: "18" },
    ],
    "Mechanical Engineering": [
      { name: "Mechanical System Engineering", intake: "9" },
      { name: "Production Engineering", intake: "18" },
      { name: "Thermal Engineering", intake: "Not specified" },
    ],
  };

const mtechDepartments = Object.keys(mtechSpecializations);

const bonafideSchema = z.object({
  academicYear: z.string().min(1, "Academic year is required (e.g. 2024-2025)"),
  collegeAdmissionDate: z.string().min(1, "College admission date is required"),
  hostelAdmissionDate: z.string().optional(),
  hostelName: z.string().optional(),
  roomNumber: z.string().optional(),
  parentName: z.string().min(2, "Parent / Guardian name is required"),
  phoneNumber: z
    .string()
    .min(10, "Valid 10-digit phone number is required")
    .max(15, "Phone number is too long"),
  reason: z
    .string()
    .min(5, "Please state the reason for requesting Bonafide Certificate"),
});

type BonafideFormData = z.infer<typeof bonafideSchema>;

export const ApplyBonafidePage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [currentSemester, setCurrentSemester] = useState("");
  const [pursuingDegree, setPursuingDegree] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [specializedCourse, setSpecializedCourse] = useState("");
  const [currentSection, setCurrentSection] = useState("");
  const [nameTitle, setNameTitle] = useState("");
  const [studentName, setStudentName] = useState("");

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BonafideFormData>({
    resolver: zodResolver(bonafideSchema),
    defaultValues: {
      academicYear: "2024-2025",
      collegeAdmissionDate: "",
      hostelAdmissionDate: "",
      hostelName: "",
      roomNumber: "",
      parentName: "",
      phoneNumber: "",
      reason: "",
    },
  });

  const onSubmit = async (data: BonafideFormData) => {
    setIsSubmitting(true);
    try {
      const payload: BonafideApplicationRequestDto & {
        pursuingDegree: string;
        currentSemester: string;
        branch: string;
        specialization?: string;
        specializedCourse?: string;
      } = {
        academicYear: data.academicYear,
        collegeAdmissionDate: data.collegeAdmissionDate,
        hostelAdmissionDate: data.hostelAdmissionDate || undefined,
        hostelName: data.hostelName || undefined,
        roomNumber: data.roomNumber || undefined,
        parentName: data.parentName,
        phoneNumber: data.phoneNumber,
        reason: data.reason,
        pursuingDegree,
        currentSemester,
        branch: selectedBranch,
        specialization:
          pursuingDegree === "MTECH" ? selectedSpecialization : undefined,
        specializedCourse:
          pursuingDegree === "MTECH" ? specializedCourse : undefined,
      };

      const response = await studentApi.applyBonafide(payload);
      await studentApi.submitApplication(response.id);
      setSubmittedId(response.id);
      toast.success("Application Submitted Successfully", {
        description: `Your Bonafide Application #${response.id} is now forwarded for DSW review.`,
      });
    } catch (error) {
      console.error("Failed to submit application:", error);
      toast.error("Could not submit Bonafide application", {
        description:
          "Check your application history; if the application was saved as a draft, submit it from there.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <Card className="glass-panel text-center p-4 border-emerald-500/30 space-y-3">
          <div className="mx-auto w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Application Submitted Successfully!
            </h2>
            <p className="text-[10px] text-slate-500">
              Your Bonafide Certificate Application reference ID is:
            </p>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold text-sm border border-blue-500/20">
              APP #{submittedId}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-[10px] text-slate-500 text-left space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Next Workflow Steps:
            </p>
            <p>
              1. DSW Review (Dean Student Welfare will verify hostel & college
              details)
            </p>
            <p>2. Principal Review (Principal approves application)</p>
            <p>
              3. Automatic PDF Certificate Generation & Download availability
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2.5"
              onClick={() => navigate("/student/dashboard")}
            >
              Go to Dashboard
            </Button>
            <Button
              size="sm"
              className="h-7 text-[10px] px-2.5"
              onClick={() => navigate(`/student/applications/${submittedId}`)}
            >
              View Application Details
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3 text-[11px]">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-7 w-7"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <div>
          <h3 className="text-sm md:text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Apply for Bonafide Certificate
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Fill in your personal, hostel, and academic details to submit a new
            request.
          </p>
        </div>
      </div>

      <Card className="glass-panel">
        <CardHeader className="border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <FilePlus2 className="w-3.5 h-3.5 text-blue-600" /> Bonafide Request
            Form
          </CardTitle>
          <CardDescription className="text-[10px]">
            All fields marked with an asterisk (*) are mandatory.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            {/* Academic & Personal Section */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                1. Academic & Personal Information
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {/* Title */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Title *</Label>

                  <Select value={nameTitle} onValueChange={setNameTitle}>
                    <SelectTrigger className="h-8 text-[11px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>

                    <SelectContent>
                      {["Shri", "Kumari", "Smt."].map((title) => (
                        <SelectItem
                          key={title}
                          value={title}
                          className="text-xs"
                        >
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student Name */}
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] font-medium">
                    Name of Student *
                  </Label>

                  <Input
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-8 text-[11px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="space-y-0.5">
                  <Label
                    className="text-[10px] font-medium"
                    htmlFor="academicYear"
                  >
                    Academic Year *
                  </Label>
                  <Input
                    id="academicYear"
                    className="h-8 text-[11px] px-2.5"
                    placeholder="2024-2025"
                    {...register("academicYear")}
                  />
                  {errors.academicYear && (
                    <p className="text-[10px] text-rose-500">
                      {errors.academicYear.message}
                    </p>
                  )}
                </div>

                {/* Pursuing Degree */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium">
                      Pursuing Degree *
                    </Label>

                    <Select
                      value={pursuingDegree}
                      onValueChange={(value) => {
                        setPursuingDegree(value);
                        setSelectedBranch("");
                        setSelectedSpecialization("");
                        setSpecializedCourse("");
                      }}
                    >
                      <SelectTrigger className="h-8 text-[11px]">
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="BTECH">B.Tech</SelectItem>
                        <SelectItem value="MTECH">M.Tech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course / Branch */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium">
                      Course / Branch *
                    </Label>

                    <Select
                      value={selectedBranch}
                      disabled={!pursuingDegree}
                      onValueChange={(value) => {
                        setSelectedBranch(value);
                        setSelectedSpecialization("");
                        setSpecializedCourse("");
                      }}
                    >
                      <SelectTrigger className="h-8 text-[11px]">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>

                      <SelectContent>
                        {(pursuingDegree === "BTECH"
                          ? btechBranches
                          : pursuingDegree === "MTECH"
                            ? mtechDepartments
                            : []
                        ).map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* M.Tech-only fields */}
                {pursuingDegree === "MTECH" && selectedBranch && (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium">
                        Specialization *
                      </Label>

                      <Select
                        value={selectedSpecialization}
                        onValueChange={(value) => {
                          setSelectedSpecialization(value);
                          setSpecializedCourse(value);
                        }}
                      >
                        <SelectTrigger className="h-8 text-[11px]">
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>

                        <SelectContent>
                          {(mtechSpecializations[selectedBranch] ?? []).map(
                            (specialization) => (
                              <SelectItem
                                key={specialization.name}
                                value={specialization.name}
                              >
                                {specialization.name} (Intake:{" "}
                                {specialization.intake})
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium">
                        Specialized in Course
                      </Label>

                      <textarea
                        value={specializedCourse}
                        onChange={(e) => setSpecializedCourse(e.target.value)}
                        placeholder="Enter additional specialization or course details"
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">
                    Current Semester *
                  </Label>

                  <Select
                    value={currentSemester}
                    onValueChange={setCurrentSemester}
                  >
                    <SelectTrigger className="h-8 text-[11px]">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>

                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                        <SelectItem
                          key={semester}
                          value={String(semester)}
                          className="text-xs"
                        >
                          Semester {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Section *</Label>

                  <Select
                    value={currentSection}
                    onValueChange={setCurrentSection}
                  >
                    <SelectTrigger className="h-8 text-[11px]">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>

                    <SelectContent>
                      {["A", "B"].map((section) => (
                        <SelectItem
                          key={section}
                          value={String(section)}
                          className="text-xs"
                        >
                          Section {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0.5">
                  <Label
                    className="text-[10px] font-medium"
                    htmlFor="collegeAdmissionDate"
                  >
                    College Admission Date *
                  </Label>
                  <Input
                    id="collegeAdmissionDate"
                    className="h-8 text-[11px] px-2.5"
                    type="date"
                    {...register("collegeAdmissionDate")}
                  />
                  {errors.collegeAdmissionDate && (
                    <p className="text-[10px] text-rose-500">
                      {errors.collegeAdmissionDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="space-y-0.5">
                  <Label
                    className="text-[10px] font-medium"
                    htmlFor="parentName"
                  >
                    Parent / Guardian Name *
                  </Label>
                  <Input
                    id="parentName"
                    className="h-8 text-[11px] px-2.5"
                    placeholder="Father or Mother Name"
                    {...register("parentName")}
                  />
                  {errors.parentName && (
                    <p className="text-[10px] text-rose-500">
                      {errors.parentName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-0.5">
                  <Label
                    className="text-[10px] font-medium"
                    htmlFor="phoneNumber"
                  >
                    Contact Phone Number *
                  </Label>
                  <Input
                    id="phoneNumber"
                    className="h-8 text-[11px] px-2.5"
                    placeholder="9876543210"
                    {...register("phoneNumber")}
                  />
                  {errors.phoneNumber && (
                    <p className="text-[10px] text-rose-500">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Hostel Section */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                2. Hostel Accommodation Details (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="space-y-0.5">
                  <Label
                    className="text-[10px] font-medium"
                    htmlFor="hostelName"
                  >
                    Hostel Name
                  </Label>
                  <Input
                    id="hostelName"
                    className="h-8 text-[11px] px-2.5"
                    placeholder="APJ Abdul Kalam Hostel"
                    {...register("hostelName")}
                  />
                </div>

                <div className="space-y-0.5">
                  <Label
                    className="text-[10px] font-medium"
                    htmlFor="roomNumber"
                  >
                    Room Number
                  </Label>
                  <Input
                    id="roomNumber"
                    className="h-8 text-[11px] px-2.5"
                    placeholder="302"
                    {...register("roomNumber")}
                  />
                </div>

                <div className="space-y-0.5">
                  <Label
                    className="text-[10px] font-medium"
                    htmlFor="hostelAdmissionDate"
                  >
                    Hostel Admission Date
                  </Label>
                  <Input
                    id="hostelAdmissionDate"
                    className="h-8 text-[11px] px-2.5"
                    type="date"
                    {...register("hostelAdmissionDate")}
                  />
                </div>
              </div>
            </div>

            {/* Reason Section */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                3. Purpose / Reason
              </h3>

              <div className="space-y-0.5">
                <Label className="text-[10px] font-medium" htmlFor="reason">
                  Reason for Certificate *
                </Label>
                <textarea
                  id="reason"
                  rows={2}
                  placeholder="State the purpose (e.g. State Scholarship, Bank Loan, Passport Application, Bus Pass...)"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  {...register("reason")}
                />
                {errors.reason && (
                  <p className="text-[10px] text-rose-500">
                    {errors.reason.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-8 text-[11px] font-semibold shadow-sm shadow-blue-500/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Submitting
                  Request...
                </>
              ) : (
                "Submit Bonafide Application"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

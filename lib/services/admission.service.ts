import { connectToDatabase } from "@/lib/db/mongodb";
import { Admission } from "@/lib/db/models/Admission";
import { Student } from "@/lib/db/models/Student";
import { Class } from "@/lib/db/models/Class";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { PaginatedResult } from "@/lib/validations/common";
import type { AdmissionInput, AdmissionEnrollInput } from "@/lib/validations/admission";
import type { AdmissionStatus } from "@/types";

interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}

export async function listAdmissions(params: ListParams): Promise<PaginatedResult<unknown>> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (params.status) filter.status = params.status;
  if (params.search) {
    filter.$or = [
      { applicantName: { $regex: params.search, $options: "i" } },
      { guardianName: { $regex: params.search, $options: "i" } },
      { contact: { $regex: params.search, $options: "i" } },
    ];
  }

  const skip = (params.page - 1) * params.pageSize;

  const [items, total] = await Promise.all([
    Admission.find(filter)
      .populate("desiredClass", "name")
      .sort({ applicationDate: -1 })
      .skip(skip)
      .limit(params.pageSize)
      .lean(),
    Admission.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function getAdmissionById(id: string) {
  await connectToDatabase();

  const admission = await Admission.findById(id).populate("desiredClass", "name sections").lean();
  if (!admission) {
    throw new NotFoundError("Admission not found.");
  }

  const student = await Student.findOne({ admission: id }).select("name studentId").lean();

  return { admission, student };
}

export async function createAdmission(input: AdmissionInput) {
  await connectToDatabase();

  const classExists = await Class.exists({ _id: input.desiredClass });
  if (!classExists) {
    throw new ConflictError("The selected class does not exist.");
  }

  return Admission.create({ ...input, status: "New" });
}

export async function updateAdmission(id: string, input: AdmissionInput) {
  await connectToDatabase();

  const admission = await Admission.findById(id);
  if (!admission) {
    throw new NotFoundError("Admission not found.");
  }
  if (admission.status === "Approved") {
    throw new ConflictError("Approved admissions cannot be edited.");
  }

  const classExists = await Class.exists({ _id: input.desiredClass });
  if (!classExists) {
    throw new ConflictError("The selected class does not exist.");
  }

  const updated = await Admission.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Admission not found.");
  }
  return updated;
}

export async function setAdmissionStatus(id: string, status: AdmissionStatus) {
  await connectToDatabase();

  const admission = await Admission.findById(id);
  if (!admission) {
    throw new NotFoundError("Admission not found.");
  }
  if (admission.status === "Approved") {
    throw new ConflictError("This admission is already approved and enrolled.");
  }
  if (status === "Approved") {
    throw new ConflictError("Use the enrollment action to approve and create a student record.");
  }

  admission.status = status;
  await admission.save();
  return admission;
}

export async function approveAndEnroll(id: string, input: AdmissionEnrollInput) {
  await connectToDatabase();

  const admission = await Admission.findById(id).populate<{
    desiredClass: { _id: string; name: string; sections: string[] };
  }>("desiredClass");
  if (!admission) {
    throw new NotFoundError("Admission not found.");
  }
  if (admission.status === "Approved") {
    throw new ConflictError("This admission has already been approved.");
  }

  const existingStudent = await Student.findOne({ admission: id });
  if (existingStudent) {
    throw new ConflictError("A student has already been created for this admission.");
  }

  if (!admission.desiredClass.sections.includes(input.section)) {
    throw new ConflictError(`Section "${input.section}" does not exist on ${admission.desiredClass.name}.`);
  }

  const count = await Student.countDocuments();
  const studentId = `STU${String(count + 1).padStart(5, "0")}`;

  const student = await Student.create({
    studentId,
    name: admission.applicantName,
    dob: input.dob,
    gender: input.gender,
    class: admission.desiredClass._id,
    section: input.section,
    guardianName: admission.guardianName,
    guardianPhone: admission.contact,
    address: input.address,
    admissionDate: new Date(),
    admission: admission._id,
    status: "Active",
  });

  admission.status = "Approved";
  await admission.save();

  return student;
}

export async function deleteAdmission(id: string) {
  await connectToDatabase();

  const studentExists = await Student.exists({ admission: id });
  if (studentExists) {
    throw new ConflictError("This admission has been converted to a student and cannot be deleted.");
  }

  const deleted = await Admission.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Admission not found.");
  }
}

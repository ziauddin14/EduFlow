import { connectToDatabase } from "@/lib/db/mongodb";
import { Fee } from "@/lib/db/models/Fee";
import { Student } from "@/lib/db/models/Student";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { FeeStatus } from "@/types";
import type { PaginatedResult } from "@/lib/validations/common";
import type { FeeInput, FeePaymentInput } from "@/lib/validations/fee";

function deriveStatus(totalAmount: number, paidAmount: number, dueDate: Date): FeeStatus {
  if (paidAmount >= totalAmount) return "Paid";
  if (dueDate.getTime() < Date.now()) return "Overdue";
  if (paidAmount > 0) return "Partial";
  return "Pending";
}

/** Self-healing: flips stale Pending/Partial records past their due date to Overdue. */
async function syncOverdueFees() {
  await Fee.updateMany(
    {
      status: { $in: ["Pending", "Partial"] },
      dueDate: { $lt: new Date() },
      $expr: { $lt: ["$paidAmount", "$totalAmount"] },
    },
    { status: "Overdue" }
  );
}

interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
  classId?: string;
  status?: string;
  month?: string;
}

export async function listFees(params: ListParams): Promise<PaginatedResult<unknown>> {
  await connectToDatabase();
  await syncOverdueFees();

  const filter: Record<string, unknown> = {};
  if (params.status) filter.status = params.status;
  if (params.month) {
    const [year, month] = params.month.split("-").map(Number);
    if (year && month) {
      filter.dueDate = {
        $gte: new Date(Date.UTC(year, month - 1, 1)),
        $lt: new Date(Date.UTC(year, month, 1)),
      };
    }
  }

  if (params.classId || params.search) {
    const studentFilter: Record<string, unknown> = {};
    if (params.classId) studentFilter.class = params.classId;
    if (params.search) {
      studentFilter.$or = [
        { name: { $regex: params.search, $options: "i" } },
        { studentId: { $regex: params.search, $options: "i" } },
      ];
    }
    const matchingStudents = await Student.find(studentFilter).select("_id").lean();
    filter.student = { $in: matchingStudents.map((s) => s._id) };
  }

  const skip = (params.page - 1) * params.pageSize;

  const [items, total] = await Promise.all([
    Fee.find(filter)
      .populate({ path: "student", select: "name studentId class", populate: { path: "class", select: "name" } })
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(params.pageSize)
      .lean(),
    Fee.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function getFeeById(id: string) {
  await connectToDatabase();
  await syncOverdueFees();

  const fee = await Fee.findById(id)
    .populate({ path: "student", select: "name studentId class", populate: { path: "class", select: "name" } })
    .lean();
  if (!fee) {
    throw new NotFoundError("Fee record not found.");
  }
  return fee;
}

export async function getStudentFeeHistory(studentId: string) {
  await connectToDatabase();
  await syncOverdueFees();

  return Fee.find({ student: studentId }).sort({ dueDate: -1 }).lean();
}

export async function createFee(input: FeeInput) {
  await connectToDatabase();

  const studentExists = await Student.exists({ _id: input.student });
  if (!studentExists) {
    throw new ConflictError("The selected student does not exist.");
  }

  const duplicate = await Fee.findOne({
    student: input.student,
    title: input.title,
    dueDate: input.dueDate,
  });
  if (duplicate) {
    throw new ConflictError("A fee record with this title and due date already exists for this student.");
  }

  const status = deriveStatus(input.totalAmount, input.paidAmount, input.dueDate);
  return Fee.create({ ...input, status });
}

export async function updateFee(id: string, input: FeeInput) {
  await connectToDatabase();

  const duplicate = await Fee.findOne({
    student: input.student,
    title: input.title,
    dueDate: input.dueDate,
    _id: { $ne: id },
  });
  if (duplicate) {
    throw new ConflictError("A fee record with this title and due date already exists for this student.");
  }

  const status = deriveStatus(input.totalAmount, input.paidAmount, input.dueDate);
  const updated = await Fee.findByIdAndUpdate(id, { ...input, status }, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Fee record not found.");
  }
  return updated;
}

export async function recordPayment(id: string, input: FeePaymentInput) {
  await connectToDatabase();

  const fee = await Fee.findById(id);
  if (!fee) {
    throw new NotFoundError("Fee record not found.");
  }

  const newPaidAmount = fee.paidAmount + input.amount;
  if (newPaidAmount > fee.totalAmount) {
    throw new ConflictError(
      `Payment of ${input.amount} would exceed the remaining balance of ${fee.totalAmount - fee.paidAmount}.`
    );
  }

  fee.paidAmount = newPaidAmount;
  fee.payments.push({ amount: input.amount, date: new Date(), method: input.method });
  fee.status = deriveStatus(fee.totalAmount, fee.paidAmount, fee.dueDate);
  await fee.save();
  return fee;
}

export async function deleteFee(id: string) {
  await connectToDatabase();

  const fee = await Fee.findById(id);
  if (!fee) {
    throw new NotFoundError("Fee record not found.");
  }
  if (fee.paidAmount > 0) {
    throw new ConflictError("Fee records with recorded payments cannot be deleted.");
  }

  await Fee.findByIdAndDelete(id);
}

export async function getFeeSummary() {
  await connectToDatabase();
  await syncOverdueFees();

  const fees = await Fee.find().select("totalAmount paidAmount status").lean();

  const totalAmount = fees.reduce((sum, f) => sum + f.totalAmount, 0);
  const collectedAmount = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const pendingAmount = totalAmount - collectedAmount;
  const overdueAmount = fees
    .filter((f) => f.status === "Overdue")
    .reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0);

  return {
    totalAmount,
    collectedAmount,
    pendingAmount,
    overdueAmount,
    recordCount: fees.length,
    collectedPercentage: totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0,
  };
}

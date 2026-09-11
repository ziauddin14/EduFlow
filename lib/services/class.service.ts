import { connectToDatabase } from "@/lib/db/mongodb";
import { Class } from "@/lib/db/models/Class";
import { Student } from "@/lib/db/models/Student";
import { Subject } from "@/lib/db/models/Subject";
import { Teacher } from "@/lib/db/models/Teacher";
import { Timetable } from "@/lib/db/models/Timetable";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import type { ClassInput } from "@/lib/validations/class";

export async function listClassesWithCounts() {
  await connectToDatabase();

  const classes = await Class.find().populate("classTeacher", "name").sort({ name: 1 }).lean();

  const counts = await Promise.all(
    classes.map(async (cls) => {
      const [studentCount, subjectCount, teacherCount] = await Promise.all([
        Student.countDocuments({ class: cls._id }),
        Subject.countDocuments({ class: cls._id }),
        Teacher.countDocuments({ classes: cls._id }),
      ]);
      return { ...cls, studentCount, subjectCount, teacherCount };
    })
  );

  return counts;
}

export async function getClassById(id: string) {
  await connectToDatabase();

  const cls = await Class.findById(id).populate("classTeacher", "name").lean();
  if (!cls) {
    throw new NotFoundError("Class not found.");
  }

  const [students, subjects, teachers] = await Promise.all([
    Student.find({ class: id }).select("name studentId section status").sort({ name: 1 }).lean(),
    Subject.find({ class: id }).populate("teacher", "name").sort({ name: 1 }).lean(),
    Teacher.find({ classes: id }).select("name designation").sort({ name: 1 }).lean(),
  ]);

  return { class: cls, students, subjects, teachers };
}

export async function createClass(input: ClassInput) {
  await connectToDatabase();

  const existing = await Class.findOne({ name: input.name });
  if (existing) {
    throw new ConflictError("A class with this name already exists.");
  }

  return Class.create(input);
}

export async function updateClass(id: string, input: ClassInput) {
  await connectToDatabase();

  const duplicate = await Class.findOne({ name: input.name, _id: { $ne: id } });
  if (duplicate) {
    throw new ConflictError("A class with this name already exists.");
  }

  const updated = await Class.findByIdAndUpdate(id, input, { returnDocument: "after" });
  if (!updated) {
    throw new NotFoundError("Class not found.");
  }
  return updated;
}

export async function deleteClass(id: string) {
  await connectToDatabase();

  const [studentCount, subjectCount, timetableCount] = await Promise.all([
    Student.countDocuments({ class: id }),
    Subject.countDocuments({ class: id }),
    Timetable.countDocuments({ class: id }),
  ]);

  if (studentCount > 0 || subjectCount > 0 || timetableCount > 0) {
    throw new ConflictError(
      "This class has students, subjects, or timetable entries linked to it and cannot be deleted."
    );
  }

  const deleted = await Class.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Class not found.");
  }
}

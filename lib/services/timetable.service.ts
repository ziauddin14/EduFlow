import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Timetable } from "@/lib/db/models/Timetable";
import { Class } from "@/lib/db/models/Class";
import { Subject } from "@/lib/db/models/Subject";
import { NotFoundError, ConflictError } from "@/lib/services/errors";
import { WEEKDAYS } from "@/types";
import type { TimetableEntryInput } from "@/lib/validations/timetable";

interface TimetableSlotDoc {
  _id?: Types.ObjectId;
  subject: Types.ObjectId;
  teacher: Types.ObjectId;
  startTime: string;
  endTime: string;
  room: string;
}

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export async function getWeeklyTimetable(classId: string, section: string) {
  await connectToDatabase();

  const docs = await Timetable.find({ class: classId, section })
    .populate("slots.subject", "name code")
    .populate("slots.teacher", "name")
    .lean();

  const byDay = new Map(docs.map((d) => [d.day, d.slots as TimetableSlotDoc[]]));

  return WEEKDAYS.map((day) => ({
    day,
    slots: (byDay.get(day) ?? [])
      .slice()
      .sort((a: TimetableSlotDoc, b: TimetableSlotDoc) => a.startTime.localeCompare(b.startTime)),
  }));
}

export async function getTeacherWeeklyTimetable(teacherId: string) {
  await connectToDatabase();

  const docs = await Timetable.find({ "slots.teacher": teacherId })
    .populate("class", "name")
    .populate("slots.subject", "name code")
    .populate("slots.teacher", "name")
    .lean();

  const byDay = new Map<string, unknown[]>(WEEKDAYS.map((d) => [d, []]));
  for (const doc of docs) {
    const teacherSlots = (doc.slots as TimetableSlotDoc[])
      .filter((s) => (s.teacher as unknown as { _id: { toString(): string } })._id.toString() === teacherId)
      .map((s) => ({ ...s, class: doc.class, section: doc.section }));
    byDay.set(doc.day, [...(byDay.get(doc.day) ?? []), ...teacherSlots]);
  }

  return WEEKDAYS.map((day) => ({
    day,
    slots: (byDay.get(day) ?? []).slice().sort((a, b) => {
      const aStart = (a as { startTime: string }).startTime;
      const bStart = (b as { startTime: string }).startTime;
      return aStart.localeCompare(bStart);
    }),
  }));
}

async function assertNoConflicts(input: TimetableEntryInput, excludeSlotId?: string) {
  const cls = await Class.findById(input.class).lean();
  if (!cls) throw new ConflictError("The selected class does not exist.");
  if (!cls.sections.includes(input.section)) {
    throw new ConflictError(`Section "${input.section}" does not exist on ${cls.name}.`);
  }

  const subject = await Subject.findById(input.subject).lean();
  if (!subject) throw new ConflictError("The selected subject does not exist.");
  if (subject.class.toString() !== input.class) {
    throw new ConflictError("The selected subject does not belong to the selected class.");
  }

  // Class/section conflict: same class+section+day, overlapping time.
  const sameClassDoc = await Timetable.findOne({ class: input.class, section: input.section, day: input.day }).lean();
  if (sameClassDoc) {
    const clash = (sameClassDoc.slots as TimetableSlotDoc[]).find(
      (s) =>
        s._id?.toString() !== excludeSlotId &&
        overlaps(s.startTime, s.endTime, input.startTime, input.endTime)
    );
    if (clash) {
      throw new ConflictError(
        `${cls.name} ${input.section} already has a class scheduled from ${clash.startTime} to ${clash.endTime} on ${input.day}.`
      );
    }
  }

  // Teacher conflict: same teacher, same day, overlapping time, any class.
  const teacherDocs = await Timetable.find({ day: input.day, "slots.teacher": input.teacher })
    .populate("class", "name")
    .lean();
  for (const doc of teacherDocs) {
    const clash = (doc.slots as TimetableSlotDoc[]).find(
      (s) =>
        s.teacher.toString() === input.teacher &&
        s._id?.toString() !== excludeSlotId &&
        overlaps(s.startTime, s.endTime, input.startTime, input.endTime)
    );
    if (clash) {
      const clashClass = doc.class as unknown as { name: string };
      throw new ConflictError(
        `This teacher is already teaching ${clashClass.name} ${doc.section} from ${clash.startTime} to ${clash.endTime} on ${input.day}.`
      );
    }
  }
}

export async function createTimetableEntry(input: TimetableEntryInput) {
  await connectToDatabase();
  await assertNoConflicts(input);

  const doc = await Timetable.findOneAndUpdate(
    { class: input.class, section: input.section, day: input.day },
    {
      $setOnInsert: { class: input.class, section: input.section, day: input.day },
      $push: {
        slots: {
          subject: input.subject,
          teacher: input.teacher,
          startTime: input.startTime,
          endTime: input.endTime,
          room: input.room,
        },
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return doc;
}

async function findSlotOwner(slotId: string) {
  const doc = await Timetable.findOne({ "slots._id": slotId });
  if (!doc) {
    throw new NotFoundError("Timetable entry not found.");
  }
  return doc;
}

export async function getSlotById(slotId: string) {
  await connectToDatabase();

  const doc = await Timetable.findOne({ "slots._id": slotId })
    .populate("class", "name sections")
    .populate("slots.subject", "name code")
    .populate("slots.teacher", "name")
    .lean();
  if (!doc) {
    throw new NotFoundError("Timetable entry not found.");
  }

  const slot = (doc.slots as TimetableSlotDoc[]).find((s) => s._id?.toString() === slotId);
  return { class: doc.class, section: doc.section, day: doc.day, slot };
}

export async function updateTimetableEntry(slotId: string, input: TimetableEntryInput) {
  await connectToDatabase();
  await assertNoConflicts(input, slotId);

  const owner = await findSlotOwner(slotId);
  owner.slots = owner.slots.filter((s: TimetableSlotDoc) => s._id?.toString() !== slotId);
  await owner.save();

  return createTimetableEntry(input);
}

export async function deleteTimetableEntry(slotId: string) {
  await connectToDatabase();

  const owner = await findSlotOwner(slotId);
  owner.slots = owner.slots.filter((s: TimetableSlotDoc) => s._id?.toString() !== slotId);
  await owner.save();
}

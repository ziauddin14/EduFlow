import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Teacher } from "@/lib/db/models/Teacher";
import { Class } from "@/lib/db/models/Class";
import { Subject } from "@/lib/db/models/Subject";
import { Student } from "@/lib/db/models/Student";
import { Admission } from "@/lib/db/models/Admission";
import { Attendance } from "@/lib/db/models/Attendance";
import { Fee } from "@/lib/db/models/Fee";
import { Exam } from "@/lib/db/models/Exam";
import { Result } from "@/lib/db/models/Result";
import { Timetable } from "@/lib/db/models/Timetable";
import { Notice } from "@/lib/db/models/Notice";
import { computeGrade, computePercentage, computePassFail } from "@/lib/services/grading";
import {
  createRng,
  pick,
  randInt,
  randomName,
  randomPhone,
  randomAddress,
  pastDate,
  futureDate,
  birthDateForAge,
  recentWeekdays,
  TEACHER_DESIGNATIONS,
  FEE_TITLES,
  NOTICES,
} from "./data";

const DEMO_PASSWORD = "Demo@123";
const rng = createRng(42);

const CLASSES = [
  { name: "Class 6", sections: ["A", "B"] },
  { name: "Class 7", sections: ["A", "B"] },
  { name: "Class 8", sections: ["A", "B"] },
  { name: "Class 9", sections: ["A", "B"] },
  { name: "Class 10", sections: ["A", "B"] },
];

const SUBJECT_NAMES = [
  { name: "Mathematics", code: "MATH" },
  { name: "English", code: "ENG" },
  { name: "Science", code: "SCI" },
  { name: "Social Studies", code: "SST" },
  { name: "Computer Science", code: "CS" },
];

const TEACHER_COUNT = 15;
const STUDENTS_PER_SECTION = 10;
const ADMISSION_COUNT = 15;
const ATTENDANCE_DAYS = 10;

async function seedUsersAndDemoTeacher() {
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [admin, teacherUser, staff] = await Promise.all([
    User.findOneAndUpdate(
      { email: "admin@eduflow.demo" },
      { name: "Admin User", email: "admin@eduflow.demo", password: hashed, role: "ADMIN", status: "Active" },
      { upsert: true, returnDocument: "after" }
    ),
    User.findOneAndUpdate(
      { email: "teacher@eduflow.demo" },
      { name: "Demo Teacher", email: "teacher@eduflow.demo", password: hashed, role: "TEACHER", status: "Active" },
      { upsert: true, returnDocument: "after" }
    ),
    User.findOneAndUpdate(
      { email: "staff@eduflow.demo" },
      { name: "Demo Staff", email: "staff@eduflow.demo", password: hashed, role: "STAFF", status: "Active" },
      { upsert: true, returnDocument: "after" }
    ),
  ]);

  await Teacher.findOneAndUpdate(
    { user: teacherUser._id },
    {
      user: teacherUser._id,
      name: teacherUser.name,
      email: teacherUser.email,
      phone: "+1-555-0100",
      designation: "Subject Teacher",
      joiningDate: new Date("2022-08-01"),
      status: "Active",
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`Seeded users: ${admin.email}, ${teacherUser.email}, ${staff.email}`);
  return { demoTeacherUserId: teacherUser._id, adminUserId: admin._id };
}

async function seedClasses() {
  const created = [];
  for (const cls of CLASSES) {
    const doc = await Class.findOneAndUpdate({ name: cls.name }, cls, { upsert: true, returnDocument: "after" });
    created.push(doc);
  }
  console.log(`Seeded ${created.length} classes.`);
  return created;
}

async function seedSubjects(classes: Awaited<ReturnType<typeof seedClasses>>) {
  const created = [];
  for (const cls of classes) {
    for (const subject of SUBJECT_NAMES) {
      const doc = await Subject.findOneAndUpdate(
        { code: subject.code, class: cls._id },
        { name: subject.name, code: subject.code, class: cls._id, status: "Active" },
        { upsert: true, returnDocument: "after" }
      );
      created.push(doc);
    }
  }
  console.log(`Seeded ${created.length} subjects.`);
  return created;
}

async function seedTeachers(
  classes: Awaited<ReturnType<typeof seedClasses>>,
  subjects: Awaited<ReturnType<typeof seedSubjects>>
) {
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  const teachers = [];

  for (let i = 1; i <= TEACHER_COUNT; i++) {
    const email = `teacher${String(i).padStart(2, "0")}@eduflow.demo`;
    const name = randomName(rng);

    const user = await User.findOneAndUpdate(
      { email },
      { name, email, password: hashed, role: "TEACHER", status: "Active" },
      { upsert: true, returnDocument: "after" }
    );

    const primaryClass = classes[i % classes.length];
    const secondaryClass = classes[(i + 1) % classes.length];
    const classIds = [primaryClass._id, secondaryClass._id];
    const classSubjects = subjects.filter(
      (s) => s.class.toString() === primaryClass._id.toString() || s.class.toString() === secondaryClass._id.toString()
    );
    const assignedSubjects = classSubjects.slice(0, randInt(rng, 2, 3)).map((s) => s._id);

    const teacher = await Teacher.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        name,
        email,
        phone: randomPhone(rng),
        designation: pick(rng, TEACHER_DESIGNATIONS),
        subjects: assignedSubjects,
        classes: classIds,
        joiningDate: pastDate(rng, 365 * 4),
        status: "Active",
      },
      { upsert: true, returnDocument: "after" }
    );
    teachers.push(teacher);
  }

  for (let i = 0; i < classes.length; i++) {
    const teacher = teachers[i % teachers.length];
    await Class.findByIdAndUpdate(classes[i]._id, { classTeacher: teacher._id });
  }

  for (const subject of subjects) {
    const eligible = teachers.filter((t) =>
      t.subjects.some((s: mongoose.Types.ObjectId) => s.toString() === subject._id.toString())
    );
    if (eligible.length > 0) {
      await Subject.findByIdAndUpdate(subject._id, { teacher: eligible[0]._id });
    }
  }

  console.log(`Seeded ${teachers.length} teachers.`);
  return teachers;
}

async function seedStudents(classes: Awaited<ReturnType<typeof seedClasses>>) {
  const students = [];
  let sequence = 1;

  for (const cls of classes) {
    const gradeNumber = Number(cls.name.replace(/\D/g, "")) || 6;
    const baseAge = gradeNumber + 5;

    for (const section of cls.sections) {
      for (let i = 0; i < STUDENTS_PER_SECTION; i++) {
        const name = randomName(rng);
        const studentId = `STU${String(sequence).padStart(5, "0")}`;
        sequence += 1;

        const student = await Student.findOneAndUpdate(
          { name, class: cls._id, section },
          {
            studentId,
            name,
            dob: birthDateForAge(rng, baseAge),
            gender: pick(rng, ["Male", "Female"] as const),
            class: cls._id,
            section,
            guardianName: randomName(rng),
            guardianPhone: randomPhone(rng),
            address: randomAddress(rng),
            admissionDate: pastDate(rng, 365 * 3),
            status: "Active",
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        students.push(student);
      }
    }
  }

  console.log(`Seeded ${students.length} students.`);
  return students;
}

async function seedAdmissions(classes: Awaited<ReturnType<typeof seedClasses>>) {
  const statuses = ["New", "Under Review", "Rejected"] as const;
  let inserted = 0;
  let preserved = 0;

  for (let i = 1; i <= ADMISSION_COUNT; i++) {
    const applicantName = randomName(rng);
    const contact = randomPhone(rng);

    // $setOnInsert only: an admission the app has since approved/reviewed/edited
    // must never be reset back to random seed state on a later `npm run seed`.
    // Missing records are still (re-)created deterministically. Existence is
    // checked explicitly rather than relying on findOneAndUpdate's upsert
    // result metadata, which this Mongoose version doesn't surface reliably.
    const alreadyExists = await Admission.exists({ applicantName, contact });

    await Admission.findOneAndUpdate(
      { applicantName, contact },
      {
        $setOnInsert: {
          applicantName,
          guardianName: randomName(rng),
          contact,
          desiredClass: pick(rng, classes)._id,
          applicationDate: pastDate(rng, 45),
          status: pick(rng, statuses),
          notes: "",
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    if (alreadyExists) {
      preserved += 1;
    } else {
      inserted += 1;
    }
  }

  console.log(`Seeded ${inserted} new admissions (${preserved} existing admissions preserved untouched).`);
}

async function seedAttendance(
  classes: Awaited<ReturnType<typeof seedClasses>>,
  students: Awaited<ReturnType<typeof seedStudents>>,
  markedBy: mongoose.Types.ObjectId
) {
  const days = recentWeekdays(ATTENDANCE_DAYS);
  let count = 0;

  for (const cls of classes) {
    for (const section of cls.sections) {
      const roster = students.filter((s) => s.class.toString() === cls._id.toString() && s.section === section);
      if (roster.length === 0) continue;

      for (const day of days) {
        const dayKey = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
        const records = roster.map((student) => {
          const roll = rng();
          const status = roll < 0.85 ? "Present" : roll < 0.95 ? "Absent" : "Late";
          return { student: student._id, status };
        });

        await Attendance.findOneAndUpdate(
          { class: cls._id, section, date: dayKey },
          { class: cls._id, section, date: dayKey, records, markedBy },
          { upsert: true, returnDocument: "after" }
        );
        count += 1;
      }
    }
  }

  console.log(`Seeded ${count} attendance records (${ATTENDANCE_DAYS} weekdays per class/section).`);
}

async function seedFees(students: Awaited<ReturnType<typeof seedStudents>>) {
  let count = 0;

  for (const student of students) {
    for (const title of FEE_TITLES.slice(0, 2)) {
      const totalAmount = 5000;
      const scenario = rng();

      let paidAmount: number;
      let dueDate: Date;
      if (scenario < 0.4) {
        paidAmount = totalAmount;
        dueDate = pastDate(rng, 90, 10);
      } else if (scenario < 0.65) {
        paidAmount = Math.round(totalAmount * (0.2 + rng() * 0.6));
        dueDate = futureDate(rng, 30, 0);
      } else if (scenario < 0.85) {
        paidAmount = 0;
        dueDate = futureDate(rng, 45, 5);
      } else {
        paidAmount = Math.round(totalAmount * rng() * 0.5);
        dueDate = pastDate(rng, 60, 5);
      }

      const payments =
        paidAmount > 0
          ? [{ amount: paidAmount, date: pastDate(rng, 30, 0), method: pick(rng, ["Cash", "Card", "Bank Transfer"]) }]
          : [];

      const status =
        paidAmount >= totalAmount ? "Paid" : dueDate.getTime() < Date.now() ? "Overdue" : paidAmount > 0 ? "Partial" : "Pending";

      await Fee.findOneAndUpdate(
        { student: student._id, title },
        { student: student._id, title, totalAmount, paidAmount, dueDate, status, payments, notes: "" },
        { upsert: true, returnDocument: "after" }
      );
      count += 1;
    }
  }

  console.log(`Seeded ${count} fee records.`);
}

async function seedExamsAndResults(
  classes: Awaited<ReturnType<typeof seedClasses>>,
  subjects: Awaited<ReturnType<typeof seedSubjects>>,
  students: Awaited<ReturnType<typeof seedStudents>>
) {
  let examCount = 0;
  let resultCount = 0;

  const examTemplates = [
    { name: "Unit Test 1", type: "Unit Test", subjectCode: "MATH", maxMarks: 50, passingMarks: 17, daysAgo: 30 },
    { name: "Midterm Examination", type: "Midterm", subjectCode: "ENG", maxMarks: 100, passingMarks: 33, daysAgo: 12 },
  ];

  for (const cls of classes) {
    for (const template of examTemplates) {
      const subject = subjects.find((s) => s.class.toString() === cls._id.toString() && s.code === template.subjectCode);
      if (!subject) continue;

      const exam = await Exam.findOneAndUpdate(
        { name: template.name, class: cls._id, subject: subject._id },
        {
          name: template.name,
          type: template.type,
          class: cls._id,
          subject: subject._id,
          date: pastDate(rng, template.daysAgo, template.daysAgo - 2),
          maxMarks: template.maxMarks,
          passingMarks: template.passingMarks,
        },
        { upsert: true, returnDocument: "after" }
      );
      examCount += 1;

      const roster = students.filter((s) => s.class.toString() === cls._id.toString());
      for (const student of roster) {
        const roll = rng();
        const obtainedMarks =
          roll < 0.8
            ? randInt(rng, template.passingMarks, template.maxMarks)
            : randInt(rng, 0, Math.max(0, template.passingMarks - 1));

        const percentage = computePercentage(obtainedMarks, template.maxMarks);
        const grade = computeGrade(percentage);
        const status = computePassFail(obtainedMarks, template.passingMarks);

        await Result.findOneAndUpdate(
          { exam: exam._id, student: student._id },
          { exam: exam._id, student: student._id, obtainedMarks, percentage, grade, status },
          { upsert: true, returnDocument: "after" }
        );
        resultCount += 1;
      }
    }
  }

  console.log(`Seeded ${examCount} exams and ${resultCount} results.`);
}

const PERIOD_TIMES = [
  { start: "08:00", end: "08:45" },
  { start: "08:45", end: "09:30" },
  { start: "09:45", end: "10:30" },
  { start: "10:30", end: "11:15" },
];
const SECTION_OFFSET_MINUTES = 195; // 3h15m — section B's block starts after section A's ends, same teacher, no overlap.

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

async function seedTimetable(
  classes: Awaited<ReturnType<typeof seedClasses>>,
  subjects: Awaited<ReturnType<typeof seedSubjects>>,
  teachers: Awaited<ReturnType<typeof seedTeachers>>
) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
  let count = 0;

  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    const cls = classes[classIndex];
    const classTeacher = teachers[classIndex % teachers.length];
    const classSubjects = subjects.filter((s) => s.class.toString() === cls._id.toString());
    if (classSubjects.length === 0) continue;

    for (let sectionIndex = 0; sectionIndex < cls.sections.length; sectionIndex++) {
      const section = cls.sections[sectionIndex];
      const offset = sectionIndex * SECTION_OFFSET_MINUTES;

      for (const day of days) {
        const slots = PERIOD_TIMES.map((period, periodIndex) => ({
          subject: classSubjects[periodIndex % classSubjects.length]._id,
          teacher: classTeacher._id,
          startTime: addMinutes(period.start, offset),
          endTime: addMinutes(period.end, offset),
          room: `Room ${100 + classIndex * 10 + sectionIndex}`,
        }));

        await Timetable.findOneAndUpdate(
          { class: cls._id, section, day },
          { class: cls._id, section, day, slots },
          { upsert: true, returnDocument: "after" }
        );
        count += 1;
      }
    }
  }

  console.log(`Seeded timetable entries for ${count} class/section/day combinations.`);
}

async function seedNotices(adminUserId: mongoose.Types.ObjectId) {
  let count = 0;

  for (let i = 0; i < NOTICES.length; i++) {
    const notice = NOTICES[i];
    const status = i < NOTICES.length - 2 ? "Published" : "Draft";

    await Notice.findOneAndUpdate(
      { title: notice.title },
      {
        title: notice.title,
        description: notice.description,
        category: notice.category,
        audience: notice.audience,
        date: pastDate(rng, 45),
        status,
        createdBy: adminUserId,
      },
      { upsert: true, returnDocument: "after" }
    );
    count += 1;
  }

  console.log(`Seeded ${count} notices.`);
}

async function main() {
  await connectToDatabase();

  const { demoTeacherUserId, adminUserId } = await seedUsersAndDemoTeacher();
  const classes = await seedClasses();
  const subjects = await seedSubjects(classes);
  const teachers = await seedTeachers(classes, subjects);
  const students = await seedStudents(classes);
  await seedAdmissions(classes);
  await seedAttendance(classes, students, demoTeacherUserId);
  await seedFees(students);
  await seedExamsAndResults(classes, subjects, students);
  await seedTimetable(classes, subjects, teachers);
  await seedNotices(adminUserId);

  console.log("\nSeed complete. Demo login password for all accounts:", DEMO_PASSWORD);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

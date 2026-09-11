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
import {
  createRng,
  pick,
  randInt,
  randomName,
  randomPhone,
  randomAddress,
  pastDate,
  birthDateForAge,
  recentWeekdays,
  TEACHER_DESIGNATIONS,
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
  return { demoTeacherUserId: teacherUser._id };
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
  let count = 0;

  for (let i = 1; i <= ADMISSION_COUNT; i++) {
    const applicantName = randomName(rng);
    const contact = randomPhone(rng);

    await Admission.findOneAndUpdate(
      { applicantName, contact },
      {
        applicantName,
        guardianName: randomName(rng),
        contact,
        desiredClass: pick(rng, classes)._id,
        applicationDate: pastDate(rng, 45),
        status: pick(rng, statuses),
        notes: "",
      },
      { upsert: true, returnDocument: "after" }
    );
    count += 1;
  }

  console.log(`Seeded ${count} admissions.`);
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

async function main() {
  await connectToDatabase();

  const { demoTeacherUserId } = await seedUsersAndDemoTeacher();
  const classes = await seedClasses();
  const subjects = await seedSubjects(classes);
  await seedTeachers(classes, subjects);
  const students = await seedStudents(classes);
  await seedAdmissions(classes);
  await seedAttendance(classes, students, demoTeacherUserId);

  console.log("\nSeed complete. Demo login password for all accounts:", DEMO_PASSWORD);
  console.log("Fee, exam, result, timetable, and notice data will be seeded alongside those modules (Day 3).");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

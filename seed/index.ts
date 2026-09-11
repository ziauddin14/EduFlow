import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Teacher } from "@/lib/db/models/Teacher";
import { Class } from "@/lib/db/models/Class";
import { Subject } from "@/lib/db/models/Subject";

const DEMO_PASSWORD = "Demo@123";

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

async function seedUsersAndTeacher() {
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [admin, teacherUser, staff] = await Promise.all([
    User.findOneAndUpdate(
      { email: "admin@eduflow.demo" },
      { name: "Admin User", email: "admin@eduflow.demo", password: hashed, role: "ADMIN", status: "Active" },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: "teacher@eduflow.demo" },
      { name: "Demo Teacher", email: "teacher@eduflow.demo", password: hashed, role: "TEACHER", status: "Active" },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: "staff@eduflow.demo" },
      { name: "Demo Staff", email: "staff@eduflow.demo", password: hashed, role: "STAFF", status: "Active" },
      { upsert: true, new: true }
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
    { upsert: true, new: true }
  );

  console.log(`Seeded users: ${admin.email}, ${teacherUser.email}, ${staff.email}`);
}

async function seedClasses() {
  const created = [];
  for (const cls of CLASSES) {
    const doc = await Class.findOneAndUpdate({ name: cls.name }, cls, { upsert: true, new: true });
    created.push(doc);
  }
  console.log(`Seeded ${created.length} classes.`);
  return created;
}

async function seedSubjects(classes: Awaited<ReturnType<typeof seedClasses>>) {
  let count = 0;
  for (const cls of classes) {
    for (const subject of SUBJECT_NAMES) {
      await Subject.findOneAndUpdate(
        { code: subject.code, class: cls._id },
        { name: subject.name, code: subject.code, class: cls._id, status: "Active" },
        { upsert: true, new: true }
      );
      count += 1;
    }
  }
  console.log(`Seeded ${count} subjects.`);
}

async function main() {
  await connectToDatabase();

  await seedUsersAndTeacher();
  const classes = await seedClasses();
  await seedSubjects(classes);

  console.log("\nDay 1 seed complete. Demo login password for all accounts:", DEMO_PASSWORD);
  console.log("Students, admissions, attendance, fees, exams, timetable, and notices are seeded");
  console.log("as their respective modules are implemented (Day 2-3).");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

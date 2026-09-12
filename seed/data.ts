/** Deterministic pseudo-random generator (mulberry32) so re-running the seed produces identical data. */
export function createRng(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export const FIRST_NAMES = [
  "Aiden", "Liam", "Noah", "Mason", "Ethan", "Lucas", "Oliver", "Elijah", "James", "Benjamin",
  "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Amelia", "Harper", "Evelyn", "Abigail",
  "Zara", "Kabir", "Aarav", "Priya", "Maya", "Leo", "Nora", "Sara", "Omar", "Layla",
  "Diego", "Valentina", "Santiago", "Camila", "Mateo", "Hana", "Yusuf", "Fatima", "Ibrahim", "Amara",
];

export const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
  "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Khan", "Ali", "Patel", "Nguyen", "Kim", "Chen", "Singh", "Cohen", "Rossi", "Muller",
];

export const STREETS = [
  "Maple Ave", "Oak Street", "Cedar Lane", "Pine Road", "Elm Street", "Birch Court", "Willow Way",
  "Sunset Blvd", "River Road", "Lakeview Drive", "Highland Ave", "Meadow Lane", "Spring Street",
];

export const CITIES = ["Riverside", "Fairview", "Brookfield", "Clearwater", "Greenfield", "Hillcrest"];

export const TEACHER_DESIGNATIONS = [
  "Subject Teacher", "Senior Teacher", "Head of Department", "Assistant Teacher", "Lead Teacher",
];

export function randomName(rng: () => number) {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

export function randomPhone(rng: () => number) {
  return `+1-555-${String(randInt(rng, 100, 999))}-${String(randInt(rng, 1000, 9999))}`;
}

export function randomAddress(rng: () => number) {
  return `${randInt(rng, 10, 9999)} ${pick(rng, STREETS)}, ${pick(rng, CITIES)}`;
}

export function pastDate(rng: () => number, maxDaysAgo: number, minDaysAgo = 0) {
  const daysAgo = randInt(rng, minDaysAgo, maxDaysAgo);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/** A birth date consistent with being roughly `baseAgeYears` old today (+/- 1 year). */
export function birthDateForAge(rng: () => number, baseAgeYears: number) {
  const years = baseAgeYears + randInt(rng, -1, 1);
  const daysAgo = years * 365 + randInt(rng, 0, 364);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function futureDate(rng: () => number, maxDaysAhead: number, minDaysAhead = 0) {
  const daysAhead = randInt(rng, minDaysAhead, maxDaysAhead);
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

export const FEE_TITLES = ["Tuition Fee - Term 1", "Tuition Fee - Term 2", "Examination Fee", "Library Fee"];

export const NOTICES = [
  {
    title: "Winter Break Schedule",
    description: "School will be closed for winter break. Classes resume on the first Monday of next term.",
    category: "Holiday",
    audience: "Everyone",
  },
  {
    title: "Midterm Examination Timetable Released",
    description: "The midterm examination schedule has been published. Please check your class timetable for exact dates and rooms.",
    category: "Exam",
    audience: "Students",
  },
  {
    title: "Annual Sports Day",
    description: "Join us for the annual sports day featuring track and field events, team sports, and a closing ceremony.",
    category: "Event",
    audience: "Everyone",
  },
  {
    title: "Staff Meeting - Term Planning",
    description: "All staff are required to attend the term planning meeting in the main hall.",
    category: "General",
    audience: "Staff",
  },
  {
    title: "Parent-Teacher Conference",
    description: "Parent-teacher conferences will be held to discuss student progress. Please schedule a slot with your class teacher.",
    category: "Event",
    audience: "Teachers",
  },
  {
    title: "Fee Payment Deadline Reminder",
    description: "This is a reminder that term fee payments are due soon. Please contact the front office for payment plans.",
    category: "General",
    audience: "Everyone",
  },
  {
    title: "Emergency Weather Closure",
    description: "Due to severe weather conditions, the school will remain closed today. Stay safe and check email for updates.",
    category: "Emergency",
    audience: "Everyone",
  },
  {
    title: "New Curriculum Guidelines",
    description: "Updated curriculum guidelines for this academic year are now available for review by teaching staff.",
    category: "General",
    audience: "Teachers",
  },
  {
    title: "Library Extended Hours",
    description: "The library will now be open until 6 PM on weekdays to support exam preparation.",
    category: "General",
    audience: "Students",
  },
  {
    title: "School Foundation Day Celebration",
    description: "Celebrate our school's founding with a day of performances, exhibitions, and alumni visits.",
    category: "Event",
    audience: "Everyone",
  },
  {
    title: "Staff Development Workshop",
    description: "A professional development workshop on modern teaching methods will be held for all teaching staff.",
    category: "General",
    audience: "Teachers",
  },
  {
    title: "Admissions Open for Next Academic Year",
    description: "Admissions for the next academic year are now open. Encourage prospective families to apply early.",
    category: "General",
    audience: "Staff",
  },
] as const;

/** Weekdays (Mon-Fri) going back from today, most recent first. */
export function recentWeekdays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  while (days.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}

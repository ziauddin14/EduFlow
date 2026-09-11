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

import type { Grade } from "@/types";

/**
 * Centralized grading scale for EduFlow. Percentage bands map to letter
 * grades; not defined elsewhere in the spec, so this is the deterministic
 * convention used project-wide — do not duplicate this logic elsewhere.
 *
 *   90-100  A+     70-79  B+     50-59  C+     <33  F
 *   80-89   A      60-69  B      33-49  D
 */
export function computeGrade(percentage: number): Grade {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

export function computePercentage(obtainedMarks: number, maxMarks: number): number {
  if (maxMarks <= 0) return 0;
  return Math.round((obtainedMarks / maxMarks) * 10000) / 100;
}

export function computePassFail(obtainedMarks: number, passingMarks: number): "Pass" | "Fail" {
  return obtainedMarks >= passingMarks ? "Pass" : "Fail";
}

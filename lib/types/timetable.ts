export interface TimetableSlot {
  _id: string;
  subject: { _id: string; name: string; code: string } | null;
  teacher: { _id: string; name: string } | null;
  startTime: string;
  endTime: string;
  room: string;
  class?: { _id: string; name: string } | null;
  section?: string;
}

export interface TimetableDay {
  day: string;
  slots: TimetableSlot[];
}

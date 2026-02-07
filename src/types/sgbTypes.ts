export type Teacher = {
  first_name: string;
  last_name: string;
  id: string;
};

export type SgbTeacherLoginResponse = {
  message: string;
  token: string;
  user: Teacher;
};

export type ScheduleDto = {
  group_id: string;
  day: string;
  hours: string;
  activity: string;
  mode: string;
  local: string;
  teacher_id: string;
};

export type CourseDto = {
  id: string;
  titre: string;
};

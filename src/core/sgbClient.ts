import fetch from "node-fetch";

export type SgbTeacherLoginResponse = {
  message: string;
  token: string;
  user: {
    first_name: string;
    last_name: string;
    id: string;
  };
};

type GroupStudentLink = {
  group_id: string;
  student_id: string;
};

type AllStudentsResponse = {
  data: { first_name: string; last_name: string; id: string }[]; // id == email (selon doc)
};

type GroupStudentResponse = {
  data: GroupStudentLink[];
};

export type StudentInfo = {
  first_name: string;
  last_name: string;
  email: string;
};

export class SgbClient {
  constructor(private readonly baseUrl: string) { }

  async loginTeacher(email: string, password: string): Promise<SgbTeacherLoginResponse> {
    const url = new URL("/api/v3/teacher/login", this.baseUrl);
    url.searchParams.set("email", email);
    url.searchParams.set("password", password);

    const resp = await fetch(url.href, { method: "GET" });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`SGB login failed (${resp.status}): ${text}`);
    }

    const data = (await resp.json()) as SgbTeacherLoginResponse;

    if (!data.token) {
      throw new Error("SGB login response missing token");
    }

    return data;
  }

  async getSchedules(token: string) {
    const res = await fetch(`${this.baseUrl}/api/v3/Schedule/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      throw new Error("Unable to fetch schedules");
    }

    return res.json();
  }

  async getCourses(token: string): Promise<{ data: { id: string; titre: string }[] }> {
    const res = await fetch(`${this.baseUrl}/api/v3/course/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("Unable to fetch courses");
    return res.json();
  }

  async getGroupStudentLinks(token: string): Promise<GroupStudentResponse> {
    const res = await fetch(`${this.baseUrl}/api/v3/student/groupstudent`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Unable to fetch group-student links");
    return (await res.json()) as GroupStudentResponse;
  }

  async getAllStudents(token: string): Promise<AllStudentsResponse> {
    const res = await fetch(`${this.baseUrl}/api/v3/student/all`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Unable to fetch students");
    return (await res.json()) as AllStudentsResponse;
  }

  async getStudentsForGroup(token: string, groupId: string): Promise<StudentInfo[]> {

    const [linksResp, studentsResp] = await Promise.all([
      this.getGroupStudentLinks(token),
      this.getAllStudents(token),
    ]);

    const links = linksResp.data ?? [];
    const students = studentsResp.data ?? [];

    const idsForGroup = new Set(
      links
        .filter(l => String(l.group_id) === String(groupId))
        .map(l => String(l.student_id))
    );

    const byId = new Map<string, { first_name: string; last_name: string; id: string }>();
    for (const s of students) byId.set(String(s.id), s);

    const result: StudentInfo[] = [];
    for (const id of idsForGroup) {
      const s = byId.get(id);
      if (!s) continue;

      result.push({
        first_name: s.first_name,
        last_name: s.last_name,
        email: s.id, 
      });
    }

    result.sort((a, b) => (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name));
    return result;
  }
}

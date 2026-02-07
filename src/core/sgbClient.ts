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
}

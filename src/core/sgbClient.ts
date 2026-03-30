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

export type SgbStudentLoginResponse = {
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

export type GroupeCoursSGA = {
  idGroupe: string;
  jour: string;
  heure: string;
  activite: string;
  mode: string;
  local: string;
  idEnseignant: string;
  idCours: string;
  titreCours: string;
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
      throw new Error(`Echec connexion SGB (${resp.status}): ${text}`);
    }

    const data = (await resp.json()) as SgbTeacherLoginResponse;

    if (!data.token) {
      throw new Error("Reponse connexion SGB sans jeton");
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
      throw new Error("Impossible de recuperer les horaires");
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

    if (!res.ok) throw new Error("Impossible de recuperer les cours");
    return res.json();
  }

  async getGroupStudentLinks(token: string): Promise<GroupStudentResponse> {
    const res = await fetch(`${this.baseUrl}/api/v3/student/groupstudent`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Impossible de recuperer les associations groupe-etudiant");
    return (await res.json()) as GroupStudentResponse;
  }

  async getAllStudents(token: string): Promise<AllStudentsResponse> {
    const res = await fetch(`${this.baseUrl}/api/v3/student/all`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Impossible de recuperer les etudiants");
    return (await res.json()) as AllStudentsResponse;
  }

  async getEtudiantsParGroupe(token: string, idGroupe: string): Promise<StudentInfo[]> {

    const [linksResp, studentsResp] = await Promise.all([
      this.getGroupStudentLinks(token),
      this.getAllStudents(token),
    ]);

    const links = linksResp.data ?? [];
    const students = studentsResp.data ?? [];

    const idsForGroup = new Set(
      links
        .filter(l => String(l.group_id) === String(idGroupe))
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

  async getStudentsForGroup(token: string, idGroupe: string): Promise<StudentInfo[]> {
    return this.getEtudiantsParGroupe(token, idGroupe);
  }

  async loginStudent(email: string, password: string): Promise<SgbStudentLoginResponse> {
    const url = new URL("/api/v3/student/login", this.baseUrl);
    url.searchParams.set("email", email);
    url.searchParams.set("password", password);

    const resp = await fetch(url.href, { method: "GET" });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Echec connexion etudiant SGB (${resp.status}): ${text}`);
    }

    const data = (await resp.json()) as SgbStudentLoginResponse;
    if (!data.token) {
      throw new Error("Reponse connexion etudiant SGB sans jeton");
    }

    return data;
  }

  async getCoursPourEtudiant(idEtudiant: string, token: string): Promise<GroupeCoursSGA[]> {
    const [groupesCours, liens] = await Promise.all([
      this.construireGroupesCours(token),
      this.getGroupStudentLinks(token),
    ]);

    const groupesEtudiant = new Set(
      (liens.data ?? [])
        .filter((l) => String(l.student_id).toLowerCase() === String(idEtudiant).toLowerCase())
        .map((l) => String(l.group_id))
    );

    return groupesCours.filter((cours) => groupesEtudiant.has(String(cours.idGroupe)));
  }

  async insererNote(
    token: string,
    payload: {
      student_id: string;
      group_id: string;
      type: string;
      type_id: number;
      grade: number;
    }
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v3/grade/insert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Impossible d'inserer la note (${res.status}): ${text}`);
    }
  }

  private async construireGroupesCours(token: string, idEnseignant?: string): Promise<GroupeCoursSGA[]> {
    const [scheduleResult, coursesResult] = await Promise.all([
      this.getSchedules(token) as Promise<{ data: { group_id: string; day: string; hours: string; activity: string; mode: string; local: string; teacher_id: string }[] }>,
      this.getCourses(token),
    ]);
    const schedules = (scheduleResult.data ?? []).filter((s) =>
      idEnseignant === undefined ? true : String(s.teacher_id) === String(idEnseignant)
    );

    const coursesById = new Map<string, { id: string; titre: string }>();
    for (const c of coursesResult.data ?? []) {
      coursesById.set(String(c.id), c);
    }

    const groupes = new Map<string, GroupeCoursSGA>();

    for (const s of schedules) {
      const idGroupe = String(s.group_id);
      if (groupes.has(idGroupe)) continue;

      const parts = idGroupe.split("-");
      const code = parts.length >= 2 ? parts[1] : null;
      const direct = code ? coursesById.get(code) : undefined;
      const fallback =
        !direct && code
          ? (coursesResult.data ?? []).find((c) => String(c.titre).includes(code))
          : undefined;
      const course = direct ?? fallback;

      groupes.set(idGroupe, {
        idGroupe: idGroupe,
        jour: String(s.day),
        heure: String(s.hours),
        idCours: course ? String(course.id) : (code ?? ""),
        titreCours: course ? String(course.titre) : (code ?? idGroupe),
        activite: String(s.activity),
        mode: String(s.mode),
        local: String(s.local),
        idEnseignant: String(s.teacher_id),
      });
    }

    return Array.from(groupes.values());
  }

  async getCours(idEnseignant: string, token: string): Promise<GroupeCoursSGA[]> {
    return this.construireGroupesCours(token, idEnseignant);
  }

  async getCoursParGroupe(
    idGroupe: string,
    token: string,
    idEnseignant?: string
  ): Promise<GroupeCoursSGA | undefined> {
    const groupes = idEnseignant
      ? await this.construireGroupesCours(token, idEnseignant)
      : await this.construireGroupesCours(token);
    return groupes.find((g) => String(g.idGroupe) === String(idGroupe));
  }

  async getListeCours(idEnseignant: string, token: string): Promise<GroupeCoursSGA[]> {
    return this.getCours(idEnseignant, token);
  }
}

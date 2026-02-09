import { Response } from "express";
import { SgbClient } from "../core/sgbClient";
import { getStoredForTeacher } from "../core/coursStore";
import { CourseDto, ScheduleDto } from "../types/sgbTypes";

const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200";
const sgbClient = new SgbClient(sgbBaseUrl);

function extractCourseCode(groupId: string): string | null {
  const parts = String(groupId).split("-");
  return parts.length >= 2 ? parts[1] : null;
}

export class HomeController {
  static async index(req: any, res: Response): Promise<void> {
    try {
      const teacher = req.session.user;
      const displayName = teacher
        ? `${teacher.first_name} ${teacher.last_name}`
        : (req.session.email ?? "Enseignant");

      const showAddCourseModal = req.query.addCourse === "1";

      const confirmRemoveGroupId =
        typeof req.query.confirmRemove === "string" ? req.query.confirmRemove : null;

      const createdGroups = teacher?.id
        ? await getStoredForTeacher(String(teacher.id))
        : [];

      let groups: any[] = [];

      if (showAddCourseModal && teacher?.id) {
        const [scheduleResult, coursesResult] = await Promise.all([
          sgbClient.getSchedules(req.session.token) as Promise<{ data: ScheduleDto[] }>,
          sgbClient.getCourses(req.session.token) as Promise<{ data: CourseDto[] }>,
        ]);

        const schedules = scheduleResult.data.filter((s) =>
          String(s.teacher_id) === String(teacher.id)
        );

        const coursesById = new Map<string, CourseDto>();
        for (const c of coursesResult.data) coursesById.set(String(c.id), c);

        const map = new Map<string, any>();

        for (const s of schedules) {
          const groupId = String(s.group_id);
          if (map.has(groupId)) continue;

          const code = extractCourseCode(groupId);

          const direct = code ? coursesById.get(code) : undefined;
          const fallback = !direct && code
            ? coursesResult.data.find((c) => String(c.titre).includes(code))
            : undefined;

          const course = direct ?? fallback;

          map.set(groupId, {
            group_id: groupId,
            course_id: course ? String(course.id) : (code ?? ""),
            course_titre: course ? String(course.titre) : (code ?? groupId),

            activity: s.activity,
            mode: s.mode,
            local: s.local,
            teacher_id: String(s.teacher_id),
          });
        }

        const createdIds = new Set(createdGroups.map((g: any) => String(g.group_id)));
        groups = Array.from(map.values()).filter(g => !createdIds.has(String(g.group_id)));
      }

      res.render("index", {
        title: "Moodle",
        displayName,
        showAddCourseModal,
        confirmRemoveGroupId, 
        groups,
        createdGroups,
      });
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Index failed");
      return;
    }
  }
}

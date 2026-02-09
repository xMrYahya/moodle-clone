import { Response } from "express";
import { SgbClient } from "../core/sgbClient";
import { addStored, removeStored, getStoredByGroupId } from "../core/coursStore";
import { getQuestionsForCours } from "../core/questionsStore";
import { CourseDto, ScheduleDto } from "../types/sgbTypes";

const sgbBaseUrl = process.env.SGB_BASE_URL ?? "http://localhost:3200";
const sgbClient = new SgbClient(sgbBaseUrl);

export class CoursController {
  static async creer(req: any, res: Response): Promise<void> {
    try {
      const teacher = req.session.user;
      const { groupId } = req.body;

      if (!teacher?.id || !groupId) {
        res.status(400).send("Missing teacher or groupId");
        return;
      }

      const [scheduleResult, coursesResult] = await Promise.all([
        sgbClient.getSchedules(req.session.token) as Promise<{ data: ScheduleDto[] }>,
        sgbClient.getCourses(req.session.token) as Promise<{ data: CourseDto[] }>,
      ]);

      const schedulesForGroup = scheduleResult.data.filter((s) =>
        String(s.teacher_id) === String(teacher.id) &&
        String(s.group_id) === String(groupId)
      );

      if (schedulesForGroup.length === 0) {
        res.status(404).send("Schedule not found for this group");
        return;
      }

      const s = schedulesForGroup[0];

      const parts = String(groupId).split("-");
      const code = parts.length >= 2 ? parts[1] : null;

      const direct = code
        ? coursesResult.data.find((c) => String(c.id) === String(code))
        : undefined;

      const fallback = !direct && code
        ? coursesResult.data.find((c) => String(c.titre).includes(code))
        : undefined;

      const course = direct ?? fallback;

      await addStored({
        group_id: String(s.group_id),
        day: String(s.day),
        hours: String(s.hours),
        activity: String(s.activity),
        mode: String(s.mode),
        local: String(s.local),
        teacher_id: String(s.teacher_id),

        course_id: course ? String(course.id) : (code ?? undefined),
        course_titre: course ? String(course.titre) : undefined,
      });

      res.redirect("/index");
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Create failed");
      return;
    }
  }

  static async supprimer(req: any, res: Response): Promise<void> {
    try {
      const { groupId } = req.body;
      if (!groupId) {
        res.redirect("/index");
        return;
      }
      await removeStored(String(groupId));
      res.redirect("/index");
      return;
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Delete failed");
      return;
    }
  }

  static async afficherQuestions(req: any, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const teacher = req.session.user;

      if (!groupId || !teacher?.id) {
        res.status(400).send("Missing groupId or userInfo");
        return;
      }

      const cours = await getStoredByGroupId(groupId);
      if (!cours) {
        res.status(404).send("Course not found");
        return;
      }

      const questions = await getQuestionsForCours(groupId);
      const showAddQuestionModal = req.query.addQuestion === "1";
      const displayName = `${teacher.first_name} ${teacher.last_name}`;

      res.render("questions", {
        title: "Questions",
        displayName,
        groupId,
        coursId: cours.course_id,
        coursTitre: cours.course_titre || cours.activity,
        questions,
        showAddQuestionModal,
      });
    } catch (e: any) {
      res.status(500).send(e?.message ?? "Failed to load questions");
    }
  }
}

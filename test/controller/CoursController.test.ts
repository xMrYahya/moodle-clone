import { jest } from "@jest/globals";

describe("CoursController", () => {
  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    delete process.env.SGB_BASE_URL;
    jest.dontMock("../../src/core/sgbClient");
  });

  function loadControllerWithMockedSgbClient() {
    const getSchedulesMock = jest.fn();
    const getCoursesMock = jest.fn();
    const SgbClientMock = jest.fn().mockImplementation((_baseUrl: string) => {
      return { getSchedules: getSchedulesMock, getCourses: getCoursesMock };
    });

    jest.doMock("../../src/core/sgbClient", () => ({
      SgbClient: SgbClientMock,
    }));

    const mod = require("../../src/controllers/CoursController");

    return {
      CoursController: mod.CoursController as typeof import("../../src/controllers/CoursController").CoursController,
      SgbClientMock,
      getSchedulesMock,
      getCoursesMock,
    };
  }

  test("module init: uses fallback URL when SGB_BASE_URL is undefined", () => {
    delete process.env.SGB_BASE_URL;
    const { SgbClientMock } = loadControllerWithMockedSgbClient();

    expect(SgbClientMock).toHaveBeenCalledTimes(1);
    expect(SgbClientMock).toHaveBeenCalledWith("http://localhost:3200");
  });

  test("module init: uses process.env.SGB_BASE_URL when defined", () => {
    process.env.SGB_BASE_URL = "http://example:7777";
    const { SgbClientMock } = loadControllerWithMockedSgbClient();

    expect(SgbClientMock).toHaveBeenCalledTimes(1);
    expect(SgbClientMock).toHaveBeenCalledWith("http://example:7777");
  });

  test("creer: missing teacher or groupId -> 400", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { /* no user */ }, body: {} };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Missing teacher or groupId");
  });

  test("creer: schedule not found for this group -> 404", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 1 }, token: "t" }, body: { groupId: "g-1" } };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Schedule not found for this group");
  });

  test("creer: success with direct course match -> addStored called and redirect", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 1,
      group_id: "g-123",
      day: "Mon",
      hours: "10-11",
      activity: "Lecture",
      mode: "In-person",
      local: "A1",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [{ id: 123, titre: "Course 123" }] });

    const coursStore = require("../../src/core/coursStore");
    const addStoredSpy = jest.spyOn(coursStore, "addStored").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 1 }, token: "t" }, body: { groupId: "g-123" } };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(addStoredSpy).toHaveBeenCalledTimes(1);
    const arg = (addStoredSpy.mock.calls[0][0] as any);
    expect(arg.course_id).toBe("123");
    expect(arg.course_titre).toBe("Course 123");
    expect(res.redirect).toHaveBeenCalledWith("/index");
  });

  test("creer: success with fallback course match -> addStored called and redirect", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 2,
      group_id: "g-XYZ",
      day: "Tue",
      hours: "9-10",
      activity: "TP",
      mode: "Online",
      local: "B2",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [{ id: 999, titre: "Course-XYZ-special" }] });

    const coursStore = require("../../src/core/coursStore");
    const addStoredSpy = jest.spyOn(coursStore, "addStored").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 2 }, token: "t" }, body: { groupId: "g-XYZ" } };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(addStoredSpy).toHaveBeenCalledTimes(1);
    const arg = (addStoredSpy.mock.calls[0][0] as any);
    expect(arg.course_id).toBe("999");
    expect(arg.course_titre).toBe("Course-XYZ-special");
    expect(res.redirect).toHaveBeenCalledWith("/index");
  });

  test("creer: no dash in groupId -> course_id undefined and redirect", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 3,
      group_id: "group",
      day: "Wed",
      hours: "8-9",
      activity: "Seminar",
      mode: "Hybrid",
      local: "C3",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });

    const coursStore = require("../../src/core/coursStore");
    const addStoredSpy = jest.spyOn(coursStore, "addStored").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 3 }, token: "t" }, body: { groupId: "group" } };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(addStoredSpy).toHaveBeenCalledTimes(1);
    const arg = (addStoredSpy.mock.calls[0][0] as any);
    expect(arg.course_id).toBeUndefined();
    expect(arg.course_titre).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith("/index");
  });

  test("creer: code present but no course match -> course_id is code", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 5,
      group_id: "g-777",
      day: "Fri",
      hours: "16-17",
      activity: "Workshop",
      mode: "In-person",
      local: "E5",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [{ id: 888, titre: "Other course" }] });

    const coursStore = require("../../src/core/coursStore");
    const addStoredSpy = jest.spyOn(coursStore, "addStored").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 5 }, token: "t" }, body: { groupId: "g-777" } };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(addStoredSpy).toHaveBeenCalledTimes(1);
    const arg = (addStoredSpy.mock.calls[0][0] as any);
    expect(arg.course_id).toBe("777");
    expect(arg.course_titre).toBeUndefined();
    expect(res.redirect).toHaveBeenCalledWith("/index");
  });

  test("creer: addStored throws -> 500 with message", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedule = {
      teacher_id: 4,
      group_id: "g-7",
      day: "Thu",
      hours: "14-15",
      activity: "Lab",
      mode: "In-person",
      local: "D4",
    };
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockResolvedValueOnce({ data: [schedule] });
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });

    const coursStore = require("../../src/core/coursStore");
    jest.spyOn(coursStore, "addStored").mockRejectedValueOnce(new Error("store-fail"));

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 4 }, token: "t" }, body: { groupId: "g-7" } };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("store-fail");
  });

  test("creer: getSchedules throws undefined -> 500 with fallback message", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getSchedules")
      .mockRejectedValueOnce(undefined);
    jest
      .spyOn(SgbModule.SgbClient.prototype, "getCourses")
      .mockResolvedValueOnce({ data: [] });

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { session: { user: { id: 6 }, token: "t" }, body: { groupId: "g-9" } };
    const res = makeRes();

    await CoursController.creer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Create failed");
  });

  test("supprimer: missing groupId -> redirect to /index", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: {} };
    const res = makeRes();

    await CoursController.supprimer(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/index");
  });

  test("supprimer: success calls removeStored and redirects", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    const removeSpy = jest.spyOn(coursStore, "removeStored").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: { groupId: 55 } };
    const res = makeRes();

    await CoursController.supprimer(req, res);

    expect(removeSpy).toHaveBeenCalledWith("55");
    expect(res.redirect).toHaveBeenCalledWith("/index");
  });

  test("supprimer: removeStored throws -> 500 with message", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    jest.spyOn(coursStore, "removeStored").mockRejectedValueOnce(new Error("remove-fail"));

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: { groupId: "x" } };
    const res = makeRes();

    await CoursController.supprimer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("remove-fail");
  });

  test("supprimer: removeStored throws undefined -> 500 with fallback message", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    jest.spyOn(coursStore, "removeStored").mockRejectedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { body: { groupId: "y" } };
    const res = makeRes();

    await CoursController.supprimer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Delete failed");
  });

  test("afficherQuestions: missing groupId or teacher -> 400", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const res = makeRes();

    await CoursController.afficherQuestions({ params: {}, session: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Missing groupId or userInfo");
  });

  test("afficherQuestions: groupId present but teacher missing -> 400", async () => {
    jest.resetModules();
    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const res = makeRes();

    await CoursController.afficherQuestions({ params: { groupId: "g-1" }, session: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Missing groupId or userInfo");
  });

  test("afficherQuestions: course not found -> 404", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    jest.spyOn(coursStore, "getStoredByGroupId").mockResolvedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = { params: { groupId: "g-1" }, session: { user: { id: 1 } } };
    const res = makeRes();

    await CoursController.afficherQuestions(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Course not found");
  });

  test("afficherQuestions: success renders with questions and modal flag", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    const questionsStore = require("../../src/core/questionsStore");
    jest.spyOn(coursStore, "getStoredByGroupId").mockResolvedValueOnce({
      group_id: "g-2",
      activity: "Lab",
      course_id: "C-1",
      course_titre: "Cours 1",
      day: "Mon",
      hours: "10-11",
      mode: "Online",
      local: "A",
      teacher_id: "1",
    });
    jest.spyOn(questionsStore, "getQuestionsForCours").mockResolvedValueOnce([
      { nom: "Q1", type: "VraiFaux" },
    ] as any);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { groupId: "g-2" },
      query: { addQuestion: "1" },
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherQuestions(req, res);

    expect(res.render).toHaveBeenCalledWith("questions", expect.objectContaining({
      displayName: "John Doe",
      groupId: "g-2",
      coursId: "C-1",
      coursTitre: "Cours 1",
      questions: [{ nom: "Q1", type: "VraiFaux" }],
      showAddQuestionModal: true,
    }));
  });

  test("afficherQuestions: course title missing -> uses activity", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    const questionsStore = require("../../src/core/questionsStore");
    jest.spyOn(coursStore, "getStoredByGroupId").mockResolvedValueOnce({
      group_id: "g-4",
      activity: "ActivityTitle",
      course_id: "C-4",
      course_titre: "",
      day: "Mon",
      hours: "10-11",
      mode: "Online",
      local: "A",
      teacher_id: "1",
    });
    jest.spyOn(questionsStore, "getQuestionsForCours").mockResolvedValueOnce([]);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { groupId: "g-4" },
      query: {},
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherQuestions(req, res);

    expect(res.render).toHaveBeenCalledWith("questions", expect.objectContaining({
      coursTitre: "ActivityTitle",
    }));
  });

  test("afficherQuestions: questions store throws -> 500 fallback", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    const questionsStore = require("../../src/core/questionsStore");
    jest.spyOn(coursStore, "getStoredByGroupId").mockResolvedValueOnce({
      group_id: "g-3",
      activity: "Lab",
      course_id: "C-2",
      course_titre: "",
      day: "Tue",
      hours: "10-11",
      mode: "Online",
      local: "A",
      teacher_id: "1",
    });
    jest.spyOn(questionsStore, "getQuestionsForCours").mockRejectedValueOnce(undefined);

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { groupId: "g-3" },
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherQuestions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Failed to load questions");
  });

  test("afficherQuestions: coursStore throws -> 500 with message", async () => {
    jest.resetModules();
    const coursStore = require("../../src/core/coursStore");
    jest.spyOn(coursStore, "getStoredByGroupId").mockRejectedValueOnce(new Error("cours-fail"));

    const CoursController = require("../../src/controllers/CoursController").CoursController;
    const req: any = {
      params: { groupId: "g-5" },
      session: { user: { id: 1, first_name: "John", last_name: "Doe" } },
    };
    const res = makeRes();

    await CoursController.afficherQuestions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("cours-fail");
  });
});

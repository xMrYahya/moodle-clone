import { jest } from "@jest/globals";

describe("HomeController.index", () => {
  const makeRes = () => {
    const res: any = {};
    res.render = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test("addCourse=1 but no teacher.id -> showAddCourseModal true, no fetch, empty groups", async () => {
    jest.resetModules();
    const HomeController = require("../../src/controllers/HomeController").HomeController;
    const req: any = { session: { email: "a@b.c" }, query: { addCourse: "1" } };
    const res = makeRes();

    await HomeController.index(req, res);

    expect(res.render).toHaveBeenCalledWith("index", expect.objectContaining({
      showAddCourseModal: true,
      groups: [],
      createdGroups: []
    }));
  });

  test("addCourse=1 with teacher but no schedules -> createdGroups returned and groups empty", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    jest.spyOn(SgbModule.SgbClient.prototype, "getSchedules").mockResolvedValueOnce({ data: [] } as any);
    jest.spyOn(SgbModule.SgbClient.prototype, "getCourses").mockResolvedValueOnce({ data: [] } as any);

    const store = require("../../src/core/coursStore");
    jest.spyOn(store, "getStoredForTeacher").mockResolvedValueOnce([{ group_id: "g-1" }] as any);

    const HomeController = require("../../src/controllers/HomeController").HomeController;
    const req: any = { session: { user: { id: 5, first_name: "F", last_name: "L" }, token: "t" }, query: { addCourse: "1" } };
    const res = makeRes();

    await HomeController.index(req, res);

    expect(res.render).toHaveBeenCalledWith("index", expect.objectContaining({
      showAddCourseModal: true,
      groups: [],
      createdGroups: [{ group_id: "g-1" }]
    }));
  });

  test("addCourse=1 with teacher: builds groups (direct, fallback, no-dash) and filters createdGroups", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    const schedules = [
      { teacher_id: 10, group_id: "g-123", activity: "A", mode: "M", local: "L" },
      { teacher_id: 10, group_id: "g-XYZ", activity: "B", mode: "N", local: "K" },
      { teacher_id: 10, group_id: "groupNoDash", activity: "C", mode: "O", local: "J" },
      { teacher_id: 99, group_id: "other", activity: "X", mode: "Y", local: "Z" },
    ];
    const courses = [
      { id: 123, titre: "Course 123" },
      { id: 999, titre: "Course-XYZ-special" }
    ];
    jest.spyOn(SgbModule.SgbClient.prototype, "getSchedules").mockResolvedValueOnce({ data: schedules } as any);
    jest.spyOn(SgbModule.SgbClient.prototype, "getCourses").mockResolvedValueOnce({ data: courses } as any);

    const store = require("../../src/core/coursStore");
    jest.spyOn(store, "getStoredForTeacher").mockResolvedValueOnce([{ group_id: "g-123" }] as any);

    const HomeController = require("../../src/controllers/HomeController").HomeController;
    const req: any = { session: { user: { id: 10, first_name: "John", last_name: "Doe" }, token: "t" }, query: { addCourse: "1" } };
    const res = makeRes();

    await HomeController.index(req, res);

    expect(res.render).toHaveBeenCalled();
    const renderArg = (res.render.mock.calls[0][1] as any);
    expect(renderArg.createdGroups).toEqual([{ group_id: "g-123" }]);
    expect(renderArg.groups.length).toBe(2);

    const gXYZ = renderArg.groups.find((g: any) => g.group_id === "g-XYZ");
    const gNoDash = renderArg.groups.find((g: any) => g.group_id === "groupNoDash");

    expect(gXYZ).toEqual(expect.objectContaining({
      group_id: "g-XYZ",
      course_id: "999",
      course_titre: "Course-XYZ-special",
      activity: "B",
      mode: "N",
      local: "K",
      teacher_id: "10"
    }));

    expect(gNoDash).toEqual(expect.objectContaining({
      group_id: "groupNoDash",
      course_id: "",
      course_titre: "groupNoDash",
      activity: "C",
      mode: "O",
      local: "J",
      teacher_id: "10"
    }));

    expect(renderArg.displayName).toBe("John Doe");
  });

  test("sgbClient throws -> returns 500 with message", async () => {
    jest.resetModules();
    const SgbModule = require("../../src/core/sgbClient");
    jest.spyOn(SgbModule.SgbClient.prototype, "getSchedules").mockRejectedValueOnce(new Error("sgb-fail"));
    const store = require("../../src/core/coursStore");
    jest.spyOn(store, "getStoredForTeacher").mockResolvedValueOnce([] as any);

    const HomeController = require("../../src/controllers/HomeController").HomeController;
    const req: any = { session: { user: { id: 1, first_name: "A", last_name: "B" }, token: "t" }, query: { addCourse: "1" } };
    const res = makeRes();

    await HomeController.index(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("sgb-fail");
    expect(res.render).not.toHaveBeenCalled();
  });
});
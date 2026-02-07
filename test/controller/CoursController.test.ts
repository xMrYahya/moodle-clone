import { jest } from "@jest/globals";

describe("CoursController", () => {
  const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
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
});

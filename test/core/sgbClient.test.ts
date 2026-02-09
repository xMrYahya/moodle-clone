import fetch from "node-fetch";
import { SgbClient, SgbTeacherLoginResponse } from "../../src/core/sgbClient";

jest.mock("node-fetch");
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("SgbClient", () => {
  const baseUrl = "http://localhost:3000";
  let client: SgbClient;

  beforeEach(() => {
    client = new SgbClient(baseUrl);
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with baseUrl", () => {
      const testUrl = "http://example.com";
      const newClient = new SgbClient(testUrl);
      expect(newClient).toBeInstanceOf(SgbClient);
    });
  });

  describe("loginTeacher", () => {
    const email = "teacher@example.com";
    const password = "password123";

    it("should successfully login and return response with token", async () => {
      const mockResponse: SgbTeacherLoginResponse = {
        message: "Success",
        token: "token123",
        user: {
          first_name: "John",
          last_name: "Doe",
          id: "user123",
        },
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await client.loginTeacher(email, password);

      expect(result).toEqual(mockResponse);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v3/teacher/login"),
        { method: "GET" }
      );
    });

    it("should include email and password as query parameters", async () => {
      const mockResponse: SgbTeacherLoginResponse = {
        message: "Success",
        token: "token123",
        user: { first_name: "Jane", last_name: "Smith", id: "user456" },
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      await client.loginTeacher(email, password);

      const callUrl = mockedFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain(`email=${encodeURIComponent(email)}`);
      expect(callUrl).toContain(`password=${encodeURIComponent(password)}`);
    });

    it("should throw error if response is not ok", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValueOnce("Unauthorized"),
      } as any);

      await expect(client.loginTeacher(email, password)).rejects.toThrow(
        "SGB login failed (401): Unauthorized"
      );
    });

    it("should throw error if response text fails", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockRejectedValueOnce(new Error("Text parse error")),
      } as any);

      await expect(client.loginTeacher(email, password)).rejects.toThrow(
        "SGB login failed (500): "
      );
    });

    it("should throw error if response is missing token", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          message: "Success",
          user: { first_name: "John", last_name: "Doe", id: "user123" },
        }),
      } as any);

      await expect(client.loginTeacher(email, password)).rejects.toThrow(
        "SGB login response missing token"
      );
    });
  });

  describe("getSchedules", () => {
    const token = "token123";

    it("should successfully fetch schedules", async () => {
      const mockSchedules = {
        data: [
          { id: "1", name: "Schedule 1" },
          { id: "2", name: "Schedule 2" },
        ],
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSchedules),
      } as any);

      const result = await client.getSchedules(token);

      expect(result).toEqual(mockSchedules);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/v3/Schedule/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
    });

    it("should throw error if response is not ok", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
      } as any);

      await expect(client.getSchedules(token)).rejects.toThrow(
        "Unable to fetch schedules"
      );
    });
  });

  describe("getCourses", () => {
    const token = "token123";

    it("should successfully fetch courses", async () => {
      const mockCourses = {
        data: [
          { id: "course1", titre: "Math 101" },
          { id: "course2", titre: "Physics 101" },
        ],
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCourses),
      } as any);

      const result = await client.getCourses(token);

      expect(result).toEqual(mockCourses);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/v3/course/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
    });

    it("should throw error if response is not ok", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
      } as any);

      await expect(client.getCourses(token)).rejects.toThrow(
        "Unable to fetch courses"
      );
    });
  });

  describe("getGroupStudentLinks", () => {
    const token = "token123";

    it("should successfully fetch group-student links", async () => {
      const mockLinks = { data: [{ group_id: "1", student_id: "s1" }] };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockLinks),
      } as any);

      const result = await client.getGroupStudentLinks(token);

      expect(result).toEqual(mockLinks);
      expect(mockedFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/v3/student/groupstudent`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
    });

    it("should throw error if response is not ok", async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false } as any);

      await expect(client.getGroupStudentLinks(token)).rejects.toThrow(
        "Unable to fetch group-student links"
      );
    });
  });

  describe("getAllStudents", () => {
    const token = "token123";

    it("should successfully fetch all students", async () => {
      const mockStudents = {
        data: [{ first_name: "A", last_name: "B", id: "a@b.com" }],
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockStudents),
      } as any);

      const result = await client.getAllStudents(token);

      expect(result).toEqual(mockStudents);
      expect(mockedFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/v3/student/all`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
    });

    it("should throw error if response is not ok", async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false } as any);

      await expect(client.getAllStudents(token)).rejects.toThrow(
        "Unable to fetch students"
      );
    });
  });

  describe("getStudentsForGroup", () => {
    const token = "token123";

    it("should return students for a group, skipping missing students and sorting by name", async () => {
      const links = {
        data: [
          { group_id: "10", student_id: "s1" },
          { group_id: "10", student_id: "s2" },
          { group_id: "99", student_id: "s3" },
          { group_id: "10", student_id: "missing" },
        ],
      };
      const students = {
        data: [
          { first_name: "Zoey", last_name: "Alpha", id: "s2" },
          { first_name: "Adam", last_name: "Zulu", id: "s1" },
        ],
      };

      mockedFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(links),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(students),
        } as any);

      const result = await client.getStudentsForGroup(token, "10");

      expect(result).toEqual([
        { first_name: "Zoey", last_name: "Alpha", email: "s2" },
        { first_name: "Adam", last_name: "Zulu", email: "s1" },
      ]);
    });

    it("should return empty array when responses have no data", async () => {
      mockedFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({}),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({}),
        } as any);

      const result = await client.getStudentsForGroup(token, "1");
      expect(result).toEqual([]);
    });
  });
});

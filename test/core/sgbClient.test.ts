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

    it("devrait se connecter et retourner une reponse avec jeton", async () => {
      const mockResponse: SgbTeacherLoginResponse = {
        message: "Succes",
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

    it("devrait inclure email et mot de passe en parametres", async () => {
      const mockResponse: SgbTeacherLoginResponse = {
        message: "Succes",
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

    it("devrait lancer une erreur si la reponse nest pas OK", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValueOnce("Non autorise"),
      } as any);

      await expect(client.loginTeacher(email, password)).rejects.toThrow(
        "Echec connexion SGB (401): Non autorise"
      );
    });

    it("devrait lancer une erreur si la lecture du texte echoue", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockRejectedValueOnce(new Error("Text parse error")),
      } as any);

      await expect(client.loginTeacher(email, password)).rejects.toThrow(
        "Echec connexion SGB (500): "
      );
    });

    it("devrait lancer une erreur si le jeton est absent", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          message: "Succes",
          user: { first_name: "John", last_name: "Doe", id: "user123" },
        }),
      } as any);

      await expect(client.loginTeacher(email, password)).rejects.toThrow(
        "Reponse connexion SGB sans jeton"
      );
    });
  });

  describe("getSchedules", () => {
    const token = "token123";

    it("devrait recuperer les horaires", async () => {
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

    it("devrait lancer une erreur si la reponse nest pas OK", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
      } as any);

      await expect(client.getSchedules(token)).rejects.toThrow(
        "Impossible de recuperer les horaires"
      );
    });
  });

  describe("getCourses", () => {
    const token = "token123";

    it("devrait recuperer les cours", async () => {
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

    it("devrait lancer une erreur si la reponse nest pas OK", async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
      } as any);

      await expect(client.getCourses(token)).rejects.toThrow(
        "Impossible de recuperer les cours"
      );
    });
  });

  describe("getGroupStudentLinks", () => {
    const token = "token123";

    it("devrait recuperer les liens groupe-etudiant", async () => {
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

    it("devrait lancer une erreur si la reponse nest pas OK", async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false } as any);

      await expect(client.getGroupStudentLinks(token)).rejects.toThrow(
        "Impossible de recuperer les associations groupe-etudiant"
      );
    });
  });

  describe("getAllStudents", () => {
    const token = "token123";

    it("devrait recuperer tous les etudiants", async () => {
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

    it("devrait lancer une erreur si la reponse nest pas OK", async () => {
      mockedFetch.mockResolvedValueOnce({ ok: false } as any);

      await expect(client.getAllStudents(token)).rejects.toThrow(
        "Impossible de recuperer les etudiants"
      );
    });
  });

  describe("getStudentsForGroup", () => {
    const token = "token123";

    it("devrait retourner les etudiants du groupe en ignorant les absents et en triant par nom", async () => {
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

    it("devrait retourner un tableau vide si les reponses nont pas de data", async () => {
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


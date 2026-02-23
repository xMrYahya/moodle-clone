import { AlreadyExistsError } from "../../../src/core/errors/alreadyExistsError";
import { InvalidParameterError } from "../../../src/core/errors/invalidParameterError";
import { NotFoundError } from "../../../src/core/errors/notFoundError";

describe("classes derreur", () => {
  test("AlreadyExistsError definit code 400 et message", () => {
    const err = new AlreadyExistsError("existe");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(400);
    expect(err.message).toBe("existe");
  });

  test("InvalidParameterError definit code 400 et message", () => {
    const err = new InvalidParameterError("invalide");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(400);
    expect(err.message).toBe("invalide");
  });

  test("NotFoundError definit code 404 et message", () => {
    const err = new NotFoundError("introuvable");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(404);
    expect(err.message).toBe("introuvable");
  });
});

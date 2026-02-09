import { AlreadyExistsError } from "../../../src/core/errors/alreadyExistsError";
import { InvalidParameterError } from "../../../src/core/errors/invalidParameterError";
import { NotFoundError } from "../../../src/core/errors/notFoundError";

describe("error classes", () => {
  test("AlreadyExistsError sets code 400 and message", () => {
    const err = new AlreadyExistsError("exists");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(400);
    expect(err.message).toBe("exists");
  });

  test("InvalidParameterError sets code 400 and message", () => {
    const err = new InvalidParameterError("invalid");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(400);
    expect(err.message).toBe("invalid");
  });

  test("NotFoundError sets code 404 and message", () => {
    const err = new NotFoundError("missing");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(404);
    expect(err.message).toBe("missing");
  });
});

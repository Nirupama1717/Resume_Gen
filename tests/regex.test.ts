import {
  EMAIL_REGEX,
  EXPERIENCE_REGEX,
  PHONE_REGEX
} from "../src/modules/ingestion/utils/regex";

describe("resume regex utilities", () => {
  test("extracts an email address", () => {
    const match = "Contact rajesh.kumar@example.com today".match(EMAIL_REGEX);

    expect(match?.[0]).toBe("rajesh.kumar@example.com");
  });

  test("extracts an Indian phone number", () => {
    const match = "Call +91-9876543210".match(PHONE_REGEX);

    expect(match?.[0]).toBe("+91-9876543210");
  });

  test("extracts integer experience from years text", () => {
    const match = "13+ years of experience".match(EXPERIENCE_REGEX);

    expect(match?.[1]).toBe("13");
  });

  test("extracts decimal experience from yrs text", () => {
    const match = "6.5 yrs of experience".match(EXPERIENCE_REGEX);

    expect(match?.[1]).toBe("6.5");
  });

  test("does not match unrelated text", () => {
    expect("experience in testing".match(EXPERIENCE_REGEX)).toBeNull();
  });
});
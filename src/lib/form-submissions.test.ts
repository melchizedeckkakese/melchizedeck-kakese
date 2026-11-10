import { describe, expect, it } from "vitest";
import { OWNER_EMAIL, submissionMessage, submissionSchema } from "./form-submissions";

describe("form owner notifications", () => {
  it("uses the owner's provided inbox", () => {
    expect(OWNER_EMAIL).toBe("melchizedeckkakese@gmail.com");
  });
  it("retains name, email, agency, role and film company in treatment requests", () => {
    const message = submissionMessage(submissionSchema.parse({ type: "treatment", title: "Test screenplay", details: { name: "Test Producer", email: "producer@example.com", role: "Director", company: "Test Films", agency: "Test Agency" } }));
    expect(message.body).toContain("Name: Test Producer");
    expect(message.body).toContain("Email: producer@example.com");
    expect(message.body).toContain("Agency: Test Agency");
    expect(message.body).toContain("Role: Director");
    expect(message.body).toContain("Company: Test Films");
  });
  it("does not allow visitors to choose a notification recipient", () => {
    const result = submissionSchema.parse({ type: "subscription", email: "reader@example.com", to: "other@example.com" });
    expect(result).not.toHaveProperty("to");
  });
});
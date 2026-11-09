import { test } from "node:test";
import { strict as assert } from "node:assert";
import { treatmentRequestSchema, synopsisNeedsPayment } from "./treatment-request";

const visitor = { name: "Test Producer", email: "producer@example.com", role: "Producer", company: "Test Films", agency: "Test Agency" };
test("treatment requests collect visitor details without payment", () => {
  assert.equal(treatmentRequestSchema.safeParse(visitor).success, true);
  for (const field of ["name", "email", "role", "company"]) {
    assert.equal(treatmentRequestSchema.safeParse({ ...visitor, [field]: "" }).success, false);
  }
});
test("locked synopsis demands payment until protected content is returned", () => {
  assert.equal(synopsisNeedsPayment({ locked: true }, null), true);
  assert.equal(synopsisNeedsPayment({ locked: "true" }, undefined), true);
  assert.equal(synopsisNeedsPayment({ locked: true }, "Paid synopsis"), false);
  assert.equal(synopsisNeedsPayment({ locked: false }, "Free synopsis"), false);
});
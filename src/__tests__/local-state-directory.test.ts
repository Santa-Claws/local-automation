import { afterEach, describe, expect, it } from "vitest";
import { getAutomatonDir } from "../identity/wallet.js";

const originalStateDir = process.env.LOCAL_AUTOMATION_HOME;

afterEach(() => {
  if (originalStateDir === undefined) delete process.env.LOCAL_AUTOMATION_HOME;
  else process.env.LOCAL_AUTOMATION_HOME = originalStateDir;
});

describe("local state directory", () => {
  it("uses LOCAL_AUTOMATION_HOME when configured", () => {
    process.env.LOCAL_AUTOMATION_HOME = "/tmp/local-automation-test-state";
    expect(getAutomatonDir()).toBe("/tmp/local-automation-test-state");
  });
});

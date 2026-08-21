import { jest } from "@jest/globals";

// All three modules main.ts depends on are ESM-only (or under test), so they
// have to be mocked before main.ts is imported.
const core = {
  setFailed: jest.fn(),
  info: jest.fn(),
  getInput: jest.fn((name: string): string => {
    const value = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`];
    return value ?? "";
  }),
};
jest.unstable_mockModule("@actions/core", () => core);

const mockContext: { payload: Record<string, any> } = { payload: {} };
jest.unstable_mockModule("@actions/github", () => ({
  context: mockContext,
}));

const mockedApprove = jest.fn();
jest.unstable_mockModule("./approve.js", () => ({ approve: mockedApprove }));

const { run } = await import("./main.js");

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  mockContext.payload = {};

  process.env = {
    GITHUB_REPOSITORY: "hmarr/test",
    "INPUT_GITHUB-TOKEN": "tok-xyz",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

test("passes the review message to approve", async () => {
  mockContext.payload = { pull_request: { number: 101 } };
  process.env["INPUT_REVIEW-MESSAGE"] = "LGTM";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith({
    token: "tok-xyz",
    context: expect.anything(),
    prNumber: 101,
    reviewMessage: "LGTM",
  });
});

test("calls approve when no PR number is provided", async () => {
  mockContext.payload = { pull_request: { number: 101 } };
  await run();
  expect(mockedApprove).toHaveBeenCalledWith({
    token: "tok-xyz",
    context: expect.anything(),
    prNumber: 101,
    reviewMessage: undefined,
  });
});

test("calls approve when a valid PR number is provided", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "456";
  await run();
  expect(mockedApprove).toHaveBeenCalledWith({
    token: "tok-xyz",
    context: expect.anything(),
    prNumber: 456,
    reviewMessage: undefined,
  });
});

test("errors when an invalid PR number is provided", async () => {
  process.env["INPUT_PULL-REQUEST-NUMBER"] = "not a number";
  await run();
  expect(mockedApprove).not.toHaveBeenCalled();
  expect(core.setFailed).toHaveBeenCalledWith(
    expect.stringContaining("Invalid `pull-request-number` value"),
  );
});

import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { qaProxy } from "./network";
function fixture() { return JSON.parse(readFileSync("work/qa-fixture.json", "utf8")) as { active: string; expired: string }; }
test("creation waits for its interactive controls before allowing submission", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/_next\/static\/.*\.js/, async route => { await gate; await route.continue(); });
  try {
    await page.goto("/create?example=1", { waitUntil: "commit" });
    await expect(page.getByRole("button", { name: "Build my Exhibit", exact: true })).toBeDisabled();
    await expect(page.getByLabel("Your public repository")).toBeDisabled();
  } finally { release(); }
  await expect(page.getByRole("button", { name: "Build my Exhibit", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Your public repository")).toHaveValue("https://github.com/shadcn-ui/taxonomy");
});
test("landing, preview, and creation work without horizontal overflow", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Proof beats/ })).toBeVisible();
  await page.getByRole("button", { name: /Citation integrity/ }).click();
  await expect(page.getByRole("button", { name: "Close source" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "work/landing-" + info.project.name + ".png", fullPage: true });
  await page.getByRole("link", { name: "Build your Exhibit" }).first().click();
  await expect(page.getByLabel("Your public repository")).toBeVisible();
  await page.getByRole("button", { name: "Try a public example" }).click();
  await expect(page.getByLabel("Your public repository")).toHaveValue("https://github.com/shadcn-ui/taxonomy");
  await expect(page.getByRole("button", { name: "Build my Exhibit" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "work/create-" + info.project.name + ".png", fullPage: true });
  expect(errors).toEqual([]);
});
test("a provider limit preserves both inputs", async ({ page }) => {
  await page.goto("/create?example=1");
  const job = await page.getByLabel("The job description").inputValue();
  await page.route("**/api/analyze", route => route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ message: "The free AI allowance is temporarily exhausted." }) }));
  await page.getByRole("button", { name: "Build my Exhibit" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "free AI allowance" })).toBeVisible();
  await expect(page.getByLabel("The job description")).toHaveValue(job);
  await expect(page.getByLabel("Your public repository")).toHaveValue("https://github.com/shadcn-ui/taxonomy");
});
test("provider cooldown prevents repeated requests and expires without an automatic retry", async ({ page }) => {
  await page.goto("/create?example=1");
  const job = await page.getByLabel("The job description").inputValue();
  let calls = 0;
  await page.route("**/api/analyze", route => {
    calls++;
    return route.fulfill({ status: 429, headers: { "Retry-After": "2" }, contentType: "application/json", body: JSON.stringify({ message: "Google is limiting free AI requests right now." }) });
  });
  await page.getByRole("button", { name: "Build my Exhibit", exact: true }).click();
  await expect(page.getByRole("button", { name: /Try again in/ })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Explore a real example" })).toHaveAttribute("href", "/example");
  await expect(page.getByRole("button", { name: "Build my Exhibit", exact: true })).toBeEnabled();
  expect(calls).toBe(1);
  await expect(page.getByLabel("The job description")).toHaveValue(job);
});
test("a streamed quota error carries its retry timing to the form", async ({ page }) => {
  await page.goto("/create?example=1");
  await page.route("**/api/analyze", route => route.fulfill({ status: 200, contentType: "application/x-ndjson", body: JSON.stringify({ type: "error", code: "FREE_LIMIT", message: "Google is limiting free AI requests right now.", retryAfter: 60 }) + "\n" }));
  await page.getByRole("button", { name: "Build my Exhibit", exact: true }).click();
  await expect(page.getByRole("button", { name: /Try again in/ })).toBeDisabled();
  await expect(page.getByRole("alert").filter({ hasText: "Google is limiting" })).toContainText("Retry after");
  await expect(page.getByLabel("Your public repository")).toHaveValue("https://github.com/shadcn-ui/taxonomy");
});
test("stored evidence opens source, copies its link, and works in a fresh browser", async ({ page, browser }, info) => {
  const id = fixture().active;
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/e/" + id);
  await expect(page.getByRole("heading", { name: /QA fixture/ })).toBeVisible();
  await expect(page.getByText("Not observed", { exact: true })).toBeVisible();
  await page.locator(".card-source-button").click();
  if (info.project.name === "mobile") await expect(page.getByRole("dialog")).toBeVisible();
  const scope = info.project.name === "mobile" ? page.getByRole("dialog") : page.locator(".desktop-inspector");
  await expect(scope.getByRole("link", { name: "Open exact source on GitHub" })).toHaveAttribute("href", /\/blob\/a{40}\/tests\/fixture.ts#L1-L1$/);
  await expect(scope.locator(".source-code")).toContainText("excerpt.includes");
  if (info.project.name === "mobile") await page.getByRole("button", { name: "Close source inspector" }).click();
  await page.getByRole("button", { name: "Copy Exhibit link" }).click();
  await expect(page.getByRole("button", { name: "Link copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("/e/" + id);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "work/exhibit-" + info.project.name + ".png", fullPage: true });
  const fresh = await browser.newContext({ proxy: qaProxy });
  const receiver = await fresh.newPage();
  await receiver.goto(new URL("/e/" + id, page.url()).href);
  await expect(receiver.getByRole("heading", { name: /QA fixture/ })).toBeVisible();
  await fresh.close();
  expect(errors).toEqual([]);
});
test("expired reports and malformed analysis input fail closed", async ({ request }) => {
  expect((await request.get("/api/exhibits/" + fixture().expired)).status()).toBe(404);
  const response = await request.post("/api/analyze", { data: { repoUrl: "https://example.com/x/y", jobDescription: "A".repeat(150) } });
  expect(response.status()).toBe(422);
  expect((await response.json()).code).toBe("INVALID_REPOSITORY");
});

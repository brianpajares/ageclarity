import { expect, test } from "@playwright/test";

test("serves the Spanish app at the site root", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Tus resultados de laboratorio, con más contexto." })
  ).toBeVisible();
});

test("calculates a local preview and supports changing language", async ({ page }) => {
  const submittedCalculationRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/api/v1/calculate")) {
      submittedCalculationRequests.push(request.url());
    }
  });

  await page.goto("/es");
  await expect(
    page.getByRole("heading", { name: "Tus resultados de laboratorio, con más contexto." })
  ).toBeVisible();

  await page.getByLabel("Edad cronológica").fill("42");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Albúmina", { exact: true }).fill("43");
  await page.getByLabel("Creatinina", { exact: true }).fill("80");
  await page.getByLabel("Glucosa", { exact: true }).fill("5.2");
  await page.getByLabel("Fosfatasa alcalina", { exact: true }).fill("70");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Proteína C reactiva (PCR / CRP)", { exact: true }).fill("1");
  await page.getByLabel("Linfocitos", { exact: true }).fill("30");
  await page.getByLabel("Volumen corpuscular medio (VCM / MCV)", { exact: true }).fill("90");
  await page.getByLabel("Ancho de distribución eritrocitaria (RDW)", { exact: true }).fill("13");
  await page.getByLabel("Leucocitos (WBC)", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Ver mi estimación" }).click();

  await expect(page.getByRole("heading", { name: "Tu estimación PhenoAge" })).toBeVisible();
  await expect(page.locator(".result-number")).toContainText(/35[.,]9/);
  await expect(page.getByRole("heading", { name: "Cómo leer tu resultado" })).toBeVisible();
  await page.getByText("Ver los 10 datos usados en el cálculo").click();
  await expect(page.locator(".input-review dd")).toHaveCount(10);
  expect(submittedCalculationRequests).toEqual([]);

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(
    page.getByRole("heading", { name: "Your lab results, with more context." })
  ).toBeVisible();
});

test("rejects invalid age without clearing the entered value", async ({ page }) => {
  await page.goto("/en");
  await page.getByLabel("Chronological age").fill("19");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").first()).toContainText("Enter a whole-number age from 20 to 84 years.");
  await expect(page.getByLabel("Chronological age")).toHaveValue("19");
});

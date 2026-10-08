import { expect, test } from "@playwright/test";

test("demo admin sees the dashboard and manages a book end to end", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Try as demo admin" }).click();

  await expect(page.getByRole("heading", { name: "Store admin" })).toBeVisible();
  await expect(page.getByText("Total revenue")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Revenue, last 30 days" })).toBeVisible();

  await page.getByRole("link", { name: "Books", exact: true }).click();
  await page.getByRole("link", { name: "New book" }).click();
  await page.getByLabel("Title").fill("Playwright in Action");
  await page.getByLabel("Author").selectOption({ label: "Andy Weir" });
  await page.getByLabel("ISBN-13").fill("9799999999991");
  await page.getByLabel("Price (USD)").fill("24.50");
  await page.getByLabel("Stock").fill("3");
  await page.getByText("Science Fiction", { exact: true }).click();
  await page.getByRole("button", { name: "Create book" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Playwright in Action" })).toBeVisible();
  await expect(page.getByText("$24.50")).toBeVisible();
  await expect(page.getByText("Only 3 left")).toBeVisible();

  await page.goto("/admin/books");
  await page.getByLabel("Filter books").fill("Playwright");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete Playwright in Action" }).click();
  await expect(page.getByText("Deleted “Playwright in Action”")).toBeVisible();

  await page.getByLabel("Filter books").fill("Dune");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete Dune" }).click();
  await expect(page.getByText(/can't delete the starter catalog/)).toBeVisible();
});

test("customers can't open the admin area", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Try as demo customer" }).click();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admins only" })).toBeVisible();
});

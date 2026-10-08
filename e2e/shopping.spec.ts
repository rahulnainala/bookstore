import { expect, test } from "@playwright/test";

test("guest finds a book, signs in with the demo account at checkout and places an order", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /find your next/i })).toBeVisible();

  // Search from the header.
  await page.getByRole("searchbox", { name: "Search books" }).fill("hobbit");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/books\?q=hobbit/);
  await expect(page.getByRole("heading", { name: "Results for “hobbit”" })).toBeVisible();

  // Open the book and add two copies to the (guest) cart.
  await page.getByRole("link", { name: "The Hobbit", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "The Hobbit" })).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

  // Cart persists for guests; checkout asks them to sign in.
  await page.getByRole("link", { name: "Cart, 2 items" }).click();
  await expect(page.getByText("$29.98").first()).toBeVisible();
  await page.getByRole("link", { name: "Sign in to checkout" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);

  // Demo sign-in merges the guest cart into the account and returns to checkout.
  await page.getByRole("button", { name: "Try as demo customer" }).click();
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("2 × The Hobbit")).toBeVisible();

  // Validation, then a valid address.
  await page.getByLabel("Full name").fill("");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Full name is required")).toBeVisible();
  await page.getByRole("button", { name: "Fill sample address" }).click();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByRole("heading", { name: /your order is confirmed/i })).toBeVisible();
  const orderHeading = page.getByRole("heading", { level: 1, name: /Order #\d+/ });
  const orderTitle = await orderHeading.textContent();
  await expect(page.getByRole("link", { name: "Cart, 0 items" })).toBeVisible();

  // Order history lists it.
  await page.getByRole("link", { name: "All orders" }).click();
  await expect(
    page.getByRole("link", { name: new RegExp(orderTitle!.replace("#", "#")) }),
  ).toBeVisible();
});

test("new customers can register and leave a review", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();

  await page.getByLabel("Name").fill("Playwright Reader");
  await page.getByLabel("Email").fill(`reader-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("a-good-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: /Playwright Reader/ })).toBeVisible();

  await page.goto("/books/dune");
  await page.getByRole("radio", { name: "4 stars" }).click();
  await page.getByLabel("Your review").fill("Spice, sand and politics. Great.");
  await page.getByRole("button", { name: "Post review" }).click();
  await expect(page.getByText("Spice, sand and politics. Great.")).toBeVisible();
});

test("catalog filters are reflected in the URL", async ({ page }) => {
  await page.goto("/books");
  await page.getByRole("button", { name: "Science Fiction" }).click();
  await expect(page).toHaveURL(/genre=science-fiction/);
  await page.getByLabel("Sort by").selectOption("price_asc");
  await expect(page).toHaveURL(/sort=price_asc/);
  await expect(page.getByRole("heading", { level: 1, name: "Science Fiction" })).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "All books" })).toBeVisible();
});

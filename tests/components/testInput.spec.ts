import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test("emits event on blur", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("text", {
            key: "My text",
            args: [{}],
        });
    });

    const input = page.getByLabel("My text");
    await input.fill("Lorem ipsum");
    await input.blur();
    // await input.press("Enter");

    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "My text",
        value: "Lorem ipsum",
        userTriggered: true,
    });
});

test("emits event on enter", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("text", {
            key: "My text",
            args: [{}],
        });
    });

    const input = page.getByLabel("My text");
    await input.fill("Lorem ipsum");
    await input.press("Enter");

    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "My text",
        value: "Lorem ipsum",
        userTriggered: true,
    });
});

test("trims input", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("text", {
            key: "My text",
            args: [{}],
        });
    });

    const input = page.getByLabel("My text");
    await input.fill(" Lorem ipsum  ");
    await input.press("Enter");

    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "My text",
        value: "Lorem ipsum",
        userTriggered: true,
    });
});

test("allows good email", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("text", {
            key: "Your email:",
            args: [{ type: "email" }],
        });
    });

    const input = page.getByLabel("Your email:");
    await input.fill("testo@check.mail");

    const error = await page.locator(".cean-status").textContent();
    expect(error).toBeFalsy();

    await input.press("Enter");
    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "Your email:",
        value: "testo@check.mail",
        userTriggered: true,
    });
});

test("flags bad email", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("text", {
            key: "Your email:",
            args: [{ type: "email" }],
        });
    });

    const input = page.getByLabel("Your email:");
    await input.fill("not.a.mail");

    const status = page.locator(".cean-status");
    expect(await status.textContent()).toBeTruthy();

    await input.press("Enter");
    const badEvent = await page.evaluate(() => window.lastEvent);
    expect(badEvent).toEqual(null);

    // Inserting a good email removes error message
    await input.fill("good@mail.test");
    expect(await status.textContent()).toBeFalsy();

    await input.press("Enter");
    const goodEvent = await page.evaluate(() => window.lastEvent);
    expect(goodEvent).toEqual({
        key: "Your email:",
        value: "good@mail.test",
        userTriggered: true,
    });
});

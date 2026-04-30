import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test("sets option from full key", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("combobox", {
            key: "Combo",
            args: [
                [
                    { key: "XX", text: "The X" },
                    { key: "Y", text: "y tho?" },
                ],
                {},
            ],
        });
    });

    const input = page.getByLabel("Combo");
    await input.fill("XX");
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("XXThe X");

    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "Combo",
        value: "XX",
        userTriggered: true,
    });
});

test("sets option from partial key", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("combobox", {
            key: "Combo",
            args: [
                [
                    { key: "XX", text: "The X" },
                    { key: "Y", text: "y tho?" },
                ],
                {},
            ],
        });
    });

    const input = page.getByLabel("Combo");
    await input.fill("X");
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("XXThe X");

    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "Combo",
        value: "XX",
        userTriggered: true,
    });
});

test("selects options with arrow keys", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("combobox", {
            key: "Combo",
            args: [
                [
                    { key: "XX", text: "The X" },
                    { key: "Y", text: "y tho?" },
                    { key: "XY", text: "Both" },
                ],
                {},
            ],
        });
    });

    const input = page.getByLabel("Combo");
    await input.fill("X");
    await input.press("ArrowDown"); // XY
    await input.press("ArrowDown"); // XX
    await input.press("ArrowDown"); // XY
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("XYBoth");

    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "Combo",
        value: "XY",
        userTriggered: true,
    });
});

test("selects options with click", async ({ page }) => {
    await page.evaluate(() => {
        window.mount("combobox", {
            key: "Combo",
            args: [
                [
                    { key: "XX", text: "The X" },
                    { key: "Y", text: "y tho?" },
                    { key: "XY", text: "Both" },
                ],
                {},
            ],
        });
    });

    const input = page.getByLabel("Combo");
    await input.focus();
    await page.locator("option").nth(1).click();

    expect(await input.inputValue()).toEqual("Yy tho?");

    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual({
        key: "Combo",
        value: "Y",
        userTriggered: true,
    });
});

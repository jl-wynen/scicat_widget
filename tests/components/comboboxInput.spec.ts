import { test, expect } from "@playwright/test";
import { expectEvent, mount } from "./util";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test("sets option from full key", async ({ page }) => {
    await mount(
        page,
        "combobox",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
        ],
        {},
    );

    const input = page.getByLabel("Combo");
    await input.fill("XX");
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("XXThe X");

    await expectEvent(page, {
        key: "Combo",
        value: "XX",
        userTriggered: true,
    });
});

test("sets option from partial key", async ({ page }) => {
    await mount(
        page,
        "combobox",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
        ],
        {},
    );

    const input = page.getByLabel("Combo");
    await input.fill("X");
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("XXThe X");

    await expectEvent(page, {
        key: "Combo",
        value: "XX",
        userTriggered: true,
    });
});

test("selects options with arrow keys", async ({ page }) => {
    await mount(
        page,
        "combobox",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
            { key: "XY", text: "Both" },
        ],
        {},
    );

    const input = page.getByLabel("Combo");
    await input.fill("X");
    await input.press("ArrowDown"); // XY
    await input.press("ArrowDown"); // XX
    await input.press("ArrowDown"); // XY
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("XYBoth");

    await expectEvent(page, {
        key: "Combo",
        value: "XY",
        userTriggered: true,
    });
});

test("opens and filters the dropdown", async ({ page }) => {
    await mount(
        page,
        "combobox",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
            { key: "XY", text: "Both" },
        ],
        {},
    );

    const input = page.getByLabel("Combo");
    const listbox = page.getByRole("listbox");
    const options = listbox.getByRole("option", { includeHidden: true });

    await expect(listbox).toBeHidden();
    await input.focus();
    await expect(listbox).toBeVisible();
    await expect(options).toHaveCount(3);

    await expect(options.nth(0).locator(".cean-item-key")).toHaveText("XX");
    await expect(options.nth(0).locator(".cean-item-text")).toHaveText("The X");

    await input.fill("Y");
    await expect(options.nth(0)).toBeHidden();
    await expect(options.nth(1)).toBeVisible();
    await expect(options.nth(2)).toBeVisible();

    await input.press("Tab");
    await expect(listbox).toBeHidden();
});

test("selects options with click", async ({ page }) => {
    await mount(
        page,
        "combobox",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
            { key: "XY", text: "Both" },
        ],
        {},
    );

    const input = page.getByLabel("Combo");
    await input.focus();
    await page.getByRole("option").nth(1).click();

    expect(await input.inputValue()).toEqual("Yy tho?");

    await expectEvent(page, {
        key: "Combo",
        value: "Y",
        userTriggered: true,
    });
});

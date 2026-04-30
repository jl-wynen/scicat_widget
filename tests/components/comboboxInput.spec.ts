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
    await page.locator("option").nth(1).click();

    expect(await input.inputValue()).toEqual("Yy tho?");

    await expectEvent(page, {
        key: "Combo",
        value: "Y",
        userTriggered: true,
    });
});

import { test, expect } from "@playwright/test";
import { expectEvent, mount, removeEvent } from "./util";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test("with choices starts out as combobox", async ({ page }) => {
    await mount(
        page,
        "comboboxManual",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
        ],
        { fieldName: "Letters" },
    );

    const input = page.getByLabel("Combo");
    await input.fill("X"); // partial entry to select an option
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("XXThe X");
    await expectEvent(page, {
        key: "Combo",
        value: "XX",
        userTriggered: true,
    });
});

test("without choices locked to text input", async ({ page }) => {
    await mount(page, "comboboxManual", "Combo", [], { fieldName: "Nothing" });

    const input = page.getByLabel("Combo");
    await input.fill("X");
    await input.press("Enter");

    expect(await input.inputValue()).toEqual("X");

    await expectEvent(page, {
        key: "Combo",
        value: "X",
        userTriggered: true,
    });

    // The toggle button is disabled:
    expect(await page.getByRole("checkbox", { disabled: true }).count()).toEqual(1);
});

test("toggle to text input keeps content", async ({ page, browserName }) => {
    // Firefox doesn't handle the input switching properly (it does in a real browser).
    test.skip(browserName === "firefox", "Still working on it");

    await mount(
        page,
        "comboboxManual",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
        ],
        { fieldName: "Letters" },
    );

    const input = page.getByLabel("Combo");
    await input.fill("X"); // partial entry to select an option
    await input.press("Enter");

    await page.getByLabel("Manual").check();
    expect(await input.inputValue()).toEqual("XX");
});

test("toggle to combobox removes content and signals", async ({
    page,
    browserName,
}) => {
    // Firefox doesn't handle the input switching properly (it does in a real browser).
    test.skip(browserName === "firefox", "Still working on it");

    await mount(
        page,
        "comboboxManual",
        "Combo",
        [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
        ],
        { fieldName: "Letters" },
    );

    await page.getByLabel("Manual").check();
    const input = page.getByLabel("Combo");
    await input.fill("X"); // partial entry to select an option
    await input.blur();
    await removeEvent(page);

    await page.getByLabel("Manual").uncheck();
    expect(await input.inputValue()).toEqual("");
    await expectEvent(page, {
        key: "Combo",
        value: null,
        userTriggered: true,
    });
});

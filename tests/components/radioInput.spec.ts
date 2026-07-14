import { Locator, test, expect } from "@playwright/test";
import { mount } from "./util";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
});

test("construct without initial", async ({ page }) => {
    await mount(page, "radio", "A choice", {
        choices: [
            { value: "first", display: "Choice 1", description: "First choice" },
            { value: "second", display: "2nd Choice", description: "Second choice" },
            { value: "third", display: "Choice C", description: "Third choice" },
        ],
    });

    const radios = page.getByRole("radio");
    expect(await radios.count()).toEqual(4);

    expect(await radios.nth(0).isChecked()).toBeFalsy();
    expect(await radios.nth(1).isChecked()).toBeFalsy();
    expect(await radios.nth(2).isChecked()).toBeFalsy();
    expect(await radios.nth(3).isChecked()).toBeFalsy();

    expect(await page.getByLabel("Choice 1").isChecked()).toBeFalsy();
    expect(await page.getByLabel("2nd Choice").isChecked()).toBeFalsy();
    expect(await page.getByLabel("Choice C").isChecked()).toBeFalsy();
    expect(await page.getByLabel("Custom value").isChecked()).toBeFalsy();
});

test("construct with initial", async ({ page }) => {
    await mount(page, "radio", "A choice", {
        choices: [
            { value: "first", display: "Choice 1", description: "First choice" },
            { value: "second", display: "2nd Choice", description: "Second choice" },
            { value: "third", display: "Choice C", description: "Third choice" },
        ],
        initial: "second",
    });

    const radios = page.getByRole("radio");
    expect(await radios.count()).toEqual(4);

    expect(await radios.nth(0).isChecked()).toBeFalsy();
    expect(await radios.nth(1).isChecked()).toBeTruthy();
    expect(await radios.nth(2).isChecked()).toBeFalsy();
    expect(await radios.nth(3).isChecked()).toBeFalsy();

    expect(await page.getByLabel("Choice 1").isChecked()).toBeFalsy();
    expect(await page.getByLabel("2nd Choice").isChecked()).toBeTruthy();
    expect(await page.getByLabel("Choice C").isChecked()).toBeFalsy();
    expect(await page.getByLabel("Custom value").isChecked()).toBeFalsy();

    expect(await page.getByRole("textbox").inputValue()).toBe("");
});

test("construct with initial custom", async ({ page }) => {
    await mount(page, "radio", "A choice", {
        choices: [
            { value: "first", display: "Choice 1", description: "First choice" },
            { value: "second", display: "2nd Choice", description: "Second choice" },
            { value: "third", display: "Choice C", description: "Third choice" },
        ],
        initial: "my value",
    });

    const radios = page.getByRole("radio");
    expect(await radios.count()).toEqual(4);

    expect(await radios.nth(0).isChecked()).toBeFalsy();
    expect(await radios.nth(1).isChecked()).toBeFalsy();
    expect(await radios.nth(2).isChecked()).toBeFalsy();
    expect(await radios.nth(3).isChecked()).toBeTruthy();

    expect(await page.getByLabel("Choice 1").isChecked()).toBeFalsy();
    expect(await page.getByLabel("2nd Choice").isChecked()).toBeFalsy();
    expect(await page.getByLabel("Choice C").isChecked()).toBeFalsy();
    expect(await page.getByLabel("Custom value").isChecked()).toBeTruthy();

    expect(await page.getByRole("textbox").inputValue()).toBe("my value");
});

test("reacts to clicks", async ({ page }) => {
    await mount(page, "radio", "A choice", {
        choices: [
            { value: "first", display: "Choice 1", description: "First choice" },
            { value: "second", display: "2nd Choice", description: "Second choice" },
            { value: "third", display: "Choice C", description: "Third choice" },
        ],
    });

    const radios = page.getByRole("radio");
    const first = page.getByLabel("Choice 1");
    const second = page.getByLabel("2nd Choice");
    const third = page.getByLabel("Choice C");
    const custom = page.getByLabel("Custom value");
    const customInput = page.getByRole("textbox");

    await third.click();
    await expectChecked(radios, [false, false, true, false]);
    await expect(customInput).not.toBeFocused();
    expect(await customInput.inputValue()).toBe("");

    await first.click();
    await expectChecked(radios, [true, false, false, false]);
    await expect(customInput).not.toBeFocused();
    expect(await customInput.inputValue()).toBe("");

    await first.click();
    await expectChecked(radios, [true, false, false, false]);
    await expect(customInput).not.toBeFocused();
    expect(await customInput.inputValue()).toBe("");

    await custom.click();
    await expectChecked(radios, [false, false, false, true]);
    await expect(customInput).toBeFocused();
    expect(await customInput.inputValue()).toBe("");

    await second.click();
    await expectChecked(radios, [false, true, false, false]);
    await expect(customInput).not.toBeFocused();
    expect(await customInput.inputValue()).toBe("");

    await customInput.click();
    await expectChecked(radios, [false, false, false, true]);
    await expect(customInput).toBeFocused();
    expect(await customInput.inputValue()).toBe("");
});

test("empty custom is invalid", async ({ page }) => {
    await mount(page, "radio", "A choice", {
        choices: [
            { value: "first", display: "Choice 1", description: "First choice" },
            { value: "second", display: "2nd Choice", description: "Second choice" },
            { value: "third", display: "Choice C", description: "Third choice" },
        ],
    });

    const first = page.getByLabel("Choice 1");
    const second = page.getByLabel("2nd Choice");
    const third = page.getByLabel("Choice C");
    const custom = page.getByLabel("Custom value");
    const customInput = page.getByRole("textbox");
    const status = page.locator(".cean-status");

    // Blur then change choice => Should show error and then remove it.
    await custom.click();
    await customInput.blur();
    // Wait for debounce timer
    await page.waitForTimeout(300);
    expect(await status.textContent()).not.toBe("");
    await first.click();
    await page.waitForTimeout(300);
    expect(await status.textContent()).toBe("");

    // Change choice without input => Should never show error message
    await custom.click();
    await second.click();
    await page.waitForTimeout(300);
    expect(await status.textContent()).toBe("");

    // Fill custom then change choice => Should not show error but keep text input value
    await customInput.click();
    await customInput.fill("my value");
    await customInput.blur();
    await page.waitForTimeout(300);
    expect(await status.textContent()).toBe("");
    expect(await customInput.inputValue()).toBe("my value");
    await third.click();
    await page.waitForTimeout(300);
    expect(await status.textContent()).toBe("");

    // Erase custom => Should show error without blur or choice change
    await customInput.click();
    await customInput.fill("");
    await page.waitForTimeout(300);
    expect(await status.textContent()).not.toBe("");
    expect(await customInput.inputValue()).toBe("");
});

async function expectChecked(radios: Locator, values: boolean[]) {
    for (let i = 0; i < values.length; ++i) {
        const radio = radios.nth(i);
        const value = values[i];
        const msgBit = value ? "checked" : "not checked";
        expect(await radio.isChecked(), `Radio ${i} is ${msgBit}`).toBe(value);
    }
}

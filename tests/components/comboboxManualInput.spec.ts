import { expect, test } from "@playwright/test";
import { expectEvent, mount, removeEvent } from "./util";
import { ComboboxManualInput } from "../../js/components/input";

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

test("can connect update listener", async ({ page }) => {
    const [combobox, text] = await page.evaluate(() => {
        const choices = [
            { key: "XX", text: "The X" },
            { key: "Y", text: "y tho?" },
        ];
        const [combobox, comboboxContainer] = window.createInputComponent(
            "comboboxManual",
            "receiver",
            choices,
            { fieldName: "Letters" },
        );
        const [text, textContainer] = window.createInputComponent(
            "text",
            "emitter",
            {},
        );

        combobox.listenToInput(
            text,
            (cb: ComboboxManualInput, value: string | null) => {
                cb.setSignaling(value, false);
            },
        );

        window.setRootChildren(comboboxContainer, textContainer);
        return [combobox, text];
    });

    const textInput = page.getByLabel("emitter");
    const comboInput = page.getByLabel("receiver");

    await textInput.fill("XX");
    await textInput.blur();
    expect(await comboInput.inputValue()).toEqual("XXThe X");

    // The listener has not been disconnected:
    await textInput.fill("Y");
    await textInput.blur();
    expect(await comboInput.inputValue()).toEqual("Yy tho?");
});

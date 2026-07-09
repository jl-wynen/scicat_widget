import { expect, galata, test } from "@jupyterlab/galata";

import * as path from "path";

test.describe("Dataset upload", () => {
    test.beforeEach(async ({ page, tmpPath }) => {
        const contents = galata.newContentsHelper(undefined, page);
        await contents.uploadDirectory(path.resolve(__dirname, "./assets"), tmpPath);
        await page.filebrowser.refresh();
    });

    test("Create widget, fill inputs, and run upload", async ({ page }) => {
        const nbPath = "dataset_upload_widget.ipynb";
        await page.notebook.openByPath(nbPath);
        await page.notebook.activate(nbPath);
        const widgetCell = 0;

        for (let i = 0; i <= widgetCell; i++) {
            expect(await page.notebook.runCell(i)).toBe(true);
        }

        const locator = await page.notebook.getCellOutputLocator(widgetCell);
        if (locator === null) throw new Error("Could not find output locator");

        await locator.getByLabel("Dataset name").fill("Test dataset name");

        await locator.getByLabel("Creation Location").fill("TEST:widget");
        await locator.getByLabel("Owner group").fill("135246");
        await locator.getByLabel("PI").fill("Principal Skinner");
        await locator.getByLabel("Contact email").fill("skinner@princi.pal");
        // Need `exact: true` to avoid conflict with 'Dataset name'
        await locator.getByLabel("Name", { exact: true }).fill("Billy Ownerson");

        const techniques = locator.getByLabel("Techniques");
        await techniques.fill("PaNET00100");
        await techniques.press("Enter");

        await locator.getByRole("tab", { name: /Files/ }).click();
        await locator.getByLabel("Source folder").fill("/source/folder");

        const fileInput = locator.getByLabel("Input new file");
        await fileInput.fill(nbPath);
        await fileInput.press("Enter");
        await expect(locator.getByLabel("Remote path")).toHaveCount(1);

        await locator.getByRole("tab", { name: /Attachments/ }).click();
        const attachmentInput = locator.getByLabel("Input new attachment");
        await attachmentInput.fill(nbPath);
        await attachmentInput.press("Enter");
        await expect(locator.getByLabel("Caption")).toHaveCount(1);

        // TODO check times: UI: local, model: UTC
        // await locator.getByRole("button", { name: "Upload dataset" }).click();
        // // TODO need to get dialog locator
        // await locator.getByRole("button", { name: "Upload", exact: true }).click();
        // await locator.getByRole("button", { name: "Close" }).click();

        // TODO catch assertion failures
        expect(await page.notebook.runCell(1));
        expect(await page.notebook.runCell(2));
    });

    test("Create widget with initial data", async ({ page }) => {
        const nbPath = "dataset_upload_widget_initial_data.ipynb";
        await page.notebook.openByPath(nbPath);
        await page.notebook.activate(nbPath);
        const widgetCell = 0;

        for (let i = 0; i <= widgetCell; i++) {
            expect(await page.notebook.runCell(i)).toBe(true);
        }

        const locator = await page.notebook.getCellOutputLocator(widgetCell);
        if (locator === null) throw new Error("Could not find output locator");

        // Values stored in <input> elements.
        const simpleValues = [
            ["Dataset name", "Test dataset"],
            ["Description", "The description\nSome insightful comments go here"],
            ["Run number", "run1"],
            ["Creation location", "Cyberspace"],
            ["Owner group", "owner 123"],
            ["License", "MIT"],
            ["type", "derived"],
        ];
        for (const [name, expected] of simpleValues) {
            expect(await locator.getByLabel(name).inputValue(), `check ${name}`).toBe(
                expected,
            );
        }

        // Values form `MultiInput`. The selected items are difficult to match with
        // the current DOM structure. So we just check that all items exist,
        // not that they are associated with the correct inputs.
        const selectedItems = [
            "prop.abc",
            "123456",
            "instr.123",
            "PI No. 1",
            "Second investigator",
            "a1",
            "A 2",
            "PaNET00206",
            "PaNET01041",
            "scitacean == 26.6.0",
            "potion.a1-2",
            "test",
            "checking how this widget works",
            "flux-1",
            "uu/geometry-123",
        ];
        for (const item of selectedItems) {
            const loc = locator.locator(`.cean-selected-item[data-value="${item}"]`);
            await expect(loc).toHaveCount(1);
            await expect(loc).toContainText(item);
        }

        // Times
        expectDate(
            await locator.getByLabel("Start").inputValue(),
            await locator.locator('input[type="time"]').first().inputValue(),
            "2020-02-01T01:01:01Z",
            "Start",
        );
        expectDate(
            await locator.getByLabel("End").inputValue(),
            await locator.locator('input[type="time"]').first().inputValue(),
            "2025-06-23T09:57:30Z",
            "End",
        );
    });
});

function expectDate(date: string, time: string, expected: string, message: string) {
    const expectedDate = new Date(expected);
    const year = expectedDate.getFullYear();
    const month = (expectedDate.getMonth() + 1).toString().padStart(2, "0");
    const day = expectedDate.getDate().toString().padStart(2, "0");
    const hours = expectedDate.getHours().toString().padStart(2, "0");
    const minutes = expectedDate.getMinutes().toString().padStart(2, "0");
    const seconds = expectedDate.getSeconds().toString().padStart(2, "0");

    expect(date, `${message} date`).toBe(`${year}-${month}-${day}`);
    expect(time, `${message} time`).toBe(`${hours}:${minutes}:${seconds}`);
}

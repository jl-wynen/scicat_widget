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

        // ----- Files -----
        const fileInput = locator.getByLabel("Input new file");
        await fileInput.fill(nbPath);
        await fileInput.press("Enter");
        await expect(locator.getByLabel("Remote path")).toHaveCount(1);

        // ----- Attachments -----
        await locator.getByRole("tab", { name: /Attachments/ }).click();
        const attachmentInput = locator.getByLabel("Input new attachment");
        await attachmentInput.fill("scicat.png");
        await attachmentInput.press("Enter");
        // Wait for the attachment to be added, if we proceeded without this, the
        // attachment might get registered in time.
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
            "2020-02-01T00:00:00Z",
            "Start",
        );
        expectDate(
            await locator.getByLabel("End").inputValue(),
            await locator.locator('input[type="time"]').last().inputValue(),
            "2025-06-23T09:57:30Z",
            "End",
        );

        // Owners
        const names = locator.getByLabel(/^Name$/);
        await expect(names, "Number of names").toHaveCount(2);
        expect(await names.nth(0).inputValue(), "Owner Name 1").toBe("Ponder Stibbons");
        expect(await names.nth(1).inputValue(), "Owner Name 2").toBe(
            "Mustrum Ridcully",
        );
        const emails = locator.getByLabel(/^Email$/);
        await expect(emails, "Number of emails").toHaveCount(2);
        expect(await emails.nth(0).inputValue(), "Owner Email 1").toBe(
            "stibbons@uu.edu",
        );
        expect(await emails.nth(1).inputValue(), "Owner Email 2").toBe("");
        const orcids = locator.getByLabel("ORCID");
        await expect(orcids, "Number of orcids").toHaveCount(2);

        // Dataset type
        expect(
            await locator.getByRole("radio", { name: "Raw" }).isChecked(),
            "Type raw unchecked",
        ).toBeFalsy();
        expect(
            await locator.getByRole("radio", { name: "Derived" }).isChecked(),
            "Type derived checked",
        ).toBeTruthy();
        expect(
            await locator.getByRole("radio", { name: "Custom" }).isChecked(),
            "Type custom unchecked",
        ).toBeFalsy();
        expect(
            await locator.getByRole("textbox", { name: "Custom" }).inputValue(),
            "No custom type",
        ).toBe("");

        // Scientific metadata
        const expectedMetadata = [
            ["both", "600000", "km/s"],
            ["value-only", "3.14", ""],
            ["unit only", "", "m^2"],
            ["neither", "", ""],
            ["", "", ""],
        ];
        const metadata = locator.locator(".cean-scientific-metadata tbody");
        for (let i = 0; i < expectedMetadata.length; i++) {
            const row = metadata.locator(`tr:nth-child(${i + 1})`);
            const [name, value, unit] = expectedMetadata[i];
            expect(
                await row.locator("td:nth-child(1) > .cean-input").inputValue(),
                `metadata ${i} name`,
            ).toBe(name);
            expect(
                await row.locator("td:nth-child(2) > .cean-input").inputValue(),
                `metadata ${i} value`,
            ).toBe(value);
            expect(
                await row.locator("td:nth-child(3) > .cean-input").inputValue(),
                `metadata ${i} unit`,
            ).toBe(unit);
        }

        // ----- Files -----
        await locator.getByRole("tab", { name: /Files/ }).click();
        expect(await locator.getByLabel("Source folder").inputValue()).toBe(
            "/scicat/upload",
        );

        expect(await locator.getByLabel("Local path").textContent()).toBe("data.csv");
        expect(await locator.getByLabel("Remote path").inputValue()).toBe("");
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

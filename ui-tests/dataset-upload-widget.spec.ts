import { expect, test } from "@jupyterlab/galata";

import * as path from "path";

test.describe("Dataset upload", () => {
    test.beforeEach(async ({ page, tmpPath }) => {
        await page.contents.uploadDirectory(
            path.resolve(__dirname, "./notebooks"),
            tmpPath,
        );
        await page.filebrowser.openDirectory(tmpPath);
    });

    test("Create widget, fill inputs, and run upload", async ({ page, tmpPath }) => {
        const notebook = "dataset_upload_widget.ipynb";
        await page.notebook.openByPath(`${tmpPath}/${notebook}`);
        await page.notebook.activate(notebook);

        const widgetCell = 0;

        for (let i = 0; i <= widgetCell; i++) {
            expect(await page.notebook.runCell(i));
        }

        const locator = await page.notebook.getCellOutputLocator(widgetCell);
        if (locator === null) throw new Error("Could not find output locator");

        await locator.getByLabel("Dataset name").fill("Test dataset name");

        await locator.getByLabel("Creation Location").fill("TEST:widget");
        await locator.getByLabel("PI").fill("Principal Skinner");
        await locator.getByLabel("Contact email").fill("skinner@princi.pal");
        // Need exact: true to avoid conflict with 'Dataset name'
        await locator.getByLabel("Name", { exact: true }).fill("Billy Ownerson");

        // TODO this fails (probably because of combobox)
        await locator.getByLabel("Owner group").fill("135246");

        await locator.getByRole("button", { name: /Files/ }).click();
        await locator.getByLabel("Source folder").fill("/source/folder");

        await locator.getByRole("button", { name: "Upload dataset" }).click();
        await locator.getByRole("button", { name: "Upload", exact: true }).click();
        await locator.getByRole("button", { name: "Close" }).click();
    });
});

// Navigation with tab key:
// await page
//     .locator("section")
//     .filter({ hasText: "NameDescriptionProposalSelect" })
//     .getByLabel("Name")
//     .press("Tab");

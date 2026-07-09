import { expect, galata, test } from "@jupyterlab/galata";

import * as path from "path";

const NOTEBOOK_FILES = [
    "dataset_upload_widget.ipynb",
    "dataset_upload_widget_initial_data.ipynb",
];

test.describe("Dataset upload", () => {
    test.beforeEach(async ({ page, tmpPath }) => {
        const contents = galata.newContentsHelper(undefined, page);
        for (const fileName of NOTEBOOK_FILES) {
            await contents.uploadFile(
                path.resolve(__dirname, `./notebooks/${fileName}`),
                `${tmpPath}/${fileName}`,
            );
        }
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

        // await locator.getByRole("button", { name: "Upload dataset" }).click();
        // // TODO need to get dialog locator
        // await locator.getByRole("button", { name: "Upload", exact: true }).click();
        // await locator.getByRole("button", { name: "Close" }).click();

        // TODO catch assertion failures
        expect(await page.notebook.runCell(1));
        expect(await page.notebook.runCell(2));
    });
});

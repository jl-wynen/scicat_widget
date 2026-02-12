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

        const widget_cell = 2;

        for (let i = 0; i <= widget_cell; i++) {
            expect(await page.notebook.runCell(i));
        }

        const locator = await page.notebook.getCellOutputLocator(widget_cell);
        expect(locator !== null);
        // locator.
    });
});

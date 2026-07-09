// These tests need to use Jupyter because they rely on the comms framework
// and Python for loading attachments.

import { expect, galata, test } from "@jupyterlab/galata";

import * as path from "path";
import { Locator } from "@playwright/test";

test.describe("MultiAttachmentInput", () => {
    test.beforeEach(async ({ page, tmpPath }) => {
        const contents = galata.newContentsHelper(undefined, page);
        await contents.uploadDirectory(path.resolve(__dirname, "./assets"), tmpPath);
        await page.filebrowser.refresh();
    });

    test("Add and remove attachments via paths", async ({ page }) => {
        const nbPath = "dataset_upload_widget_minimal.ipynb";
        await page.notebook.openByPath(nbPath);
        await page.notebook.activate(nbPath);
        const widgetCell = 0;
        for (let i = 0; i <= widgetCell; i++) {
            expect(await page.notebook.runCell(i)).toBe(true);
        }
        const locator = await page.notebook.getCellOutputLocator(widgetCell);
        if (locator === null) throw new Error("Could not find output locator");

        await locator.getByRole("tab", { name: /Attachments/ }).click();
        const attachmentInput = locator.getByLabel("Input new attachment");

        // ----- Add 2 attachments -----
        await attachmentInput.fill("scicat.png");
        await attachmentInput.press("Enter");
        // Wait for the attachment to be added, if we proceeded without this, the
        // attachment might get registered in time.
        await expect(locator.getByLabel("Caption")).toHaveCount(1);

        await attachmentInput.fill(nbPath);
        await attachmentInput.press("Enter");
        await expect(locator.getByLabel("Caption")).toHaveCount(2);

        await expectAttachment(locator, 0, true, "scicat.png", "scicat");
        await expectAttachment(
            locator,
            1,
            false,
            nbPath,
            "dataset_upload_widget_minimal",
        );

        // ----- Remove 1st attachment -----
        await locator
            .locator(".cean-attachment-view")
            .nth(0)
            .getByTitle("Remove item")
            .click();
        await expect(locator.getByLabel("Caption")).toHaveCount(1);
        await expectAttachment(
            locator,
            0,
            false,
            nbPath,
            "dataset_upload_widget_minimal",
        );

        // ----- Add another attachment -----
        await attachmentInput.fill("data.csv");
        await attachmentInput.press("Enter");
        await expect(locator.getByLabel("Caption")).toHaveCount(2);
        await expectAttachment(
            locator,
            0,
            false,
            nbPath,
            "dataset_upload_widget_minimal",
        );
        await expectAttachment(locator, 1, false, "data.csv", /^data$/);

        // ----- Remove all attachments -----
        await locator
            .locator(".cean-attachment-view")
            .nth(1)
            .getByTitle("Remove item")
            .click();
        await locator
            .locator(".cean-attachment-view")
            .nth(0)
            .getByTitle("Remove item")
            .click();
        await expect(locator.getByLabel("Caption")).toHaveCount(0);

        // ----- Add 1st attachment back in -----
        await attachmentInput.fill("scicat.png");
        await attachmentInput.press("Enter");
        await expect(locator.getByLabel("Caption")).toHaveCount(1);
        await expectAttachment(locator, 0, true, "scicat.png", "scicat");
    });

    test("Add attachments via file browser", async ({ page }) => {
        const nbPath = "dataset_upload_widget_minimal.ipynb";
        await page.notebook.openByPath(nbPath);
        await page.notebook.activate(nbPath);
        const widgetCell = 0;
        for (let i = 0; i <= widgetCell; i++) {
            expect(await page.notebook.runCell(i)).toBe(true);
        }
        const locator = await page.notebook.getCellOutputLocator(widgetCell);
        if (locator === null) throw new Error("Could not find output locator");

        await locator.getByRole("tab", { name: /Attachments/ }).click();
        const browseButton = locator.getByRole("button", { name: "Browse" });

        await browseButton.click();
        const dialog = page.locator(".jphf-dialog");
        await dialog.getByRole("cell", { name: "scicat.png" }).click();
        await dialog.getByRole("button", { name: "Select file" }).click();

        await expect(locator.getByLabel("Caption")).toHaveCount(1);
        await expectAttachment(locator, 0, true, "scicat.png", "scicat");
    });
});

async function expectAttachment(
    locator: Locator,
    index: number,
    isImage: boolean,
    path: string,
    caption: string | RegExp,
) {
    expect(
        await locator.getByLabel("Path").nth(index).textContent(),
        `Attachment ${index} Path`,
    ).toBe(path);

    // We can't read the placeholder, so check that an
    // input with this placeholder exists as the next best option.
    await expect(locator.getByPlaceholder(caption)).toHaveCount(1);

    await expect(
        locator.locator(".cean-image-container").nth(index).getByRole("img"),
        `Attachment ${index} hasImg`,
    ).toHaveCount(isImage ? 1 : 0);
}

import { expect, Page } from "@playwright/test";

export function mount(
    page: Page,
    ty: string,
    key: string,
    ...args: any[]
): Promise<void> {
    return page.evaluate(
        ([ty, key, args]) => {
            window.mount(ty, { key, args });
        },
        [ty, key, args],
    );
}

export type EventPayload = {
    key: string;
    value: any;
    userTriggered?: boolean;
};

export async function expectEvent(page: Page, payload: EventPayload) {
    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual(payload);
}

export async function expectNoEvent(page: Page) {
    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual(null);
}

export async function removeEvent(page: Page) {
    await page.evaluate(() => (window.lastEvent = null));
}

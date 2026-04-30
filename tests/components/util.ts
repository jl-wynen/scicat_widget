import { expect, Page } from "@playwright/test";

export function mount(
    page: Page,
    ty: string,
    key: string,
    ...args: any[]
): Promise<void> {
    return page.evaluate(
        ([ty, key, args]) => {
            // @ts-ignore
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
    // @ts-ignore
    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual(payload);
}

export async function expectNoEvent(page: Page) {
    // @ts-ignore
    const event = await page.evaluate(() => window.lastEvent);
    expect(event).toEqual(null);
}

export async function removeEvent(page: Page) {
    // @ts-ignore
    await page.evaluate(() => (window.lastEvent = null));
}

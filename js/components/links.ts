/** Create a link with an image */
export function imageLink(href: string, imageHTML: string): HTMLAnchorElement {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.innerHTML = imageHTML;
    return anchor;
}

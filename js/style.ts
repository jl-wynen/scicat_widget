export function animateValueSet(element: HTMLElement) {
    element.animate(
        [
            { borderColor: "var(--jp-input-active-border-color)" },
            { borderColor: "var(--jp-input-active-border-color)", offset: 0.8 },
            { borderColor: "var(--jp-cell-editor-border-color)" },
        ],
        {
            duration: 500,
            easing: "ease-out",
        },
    );
}

/// <reference types="vite/types/import-meta" />
import { Game } from "./Game.js";

window.addEventListener("DOMContentLoaded", async () => {
    const game = new Game("renderCanvas");

    if (import.meta.env?.DEV) {
        try {
            await import("@babylonjs/core/Debug/debugLayer.js");
            await import("@babylonjs/inspector"); // dist/babylon.inspector.bundle.max.js
            // Hide/show the Inspector
            window.addEventListener("keydown", (evt) => {
                // Ctrl+I
                if (evt.ctrlKey && !evt.shiftKey && evt.key === "i") {
                    if (game.scene?.debugLayer?.isVisible()) {
                        game.scene.debugLayer.hide();
                    } else {
                        game.scene?.debugLayer.show();
                    }
                    evt.preventDefault();
                }
            });
        } catch (e: any) {
            console.log(`Failed to load inspector: ${e.message}`);
        }
    }

    game.start();
});

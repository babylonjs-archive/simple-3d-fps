import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { Scene } from "@babylonjs/core/scene.js";

import { FirstLevel } from "./game/levels/FirstLevel.js";
import { CreditsLevel } from "./game/levels/CreditsLevel.js";
import { HomeMenuLevel } from "./game/levels/HomeMenuLevel.js";
import type { Level } from "./base/Level.js";

import "@babylonjs/core/Audio/audioSceneComponent.js";
import "@babylonjs/core/Collisions/collisionCoordinator.js";
import "@babylonjs/core/Helpers/sceneHelpers.js";
import "@babylonjs/core/Loading/loadingScreen.js";
import "@babylonjs/core/Materials/standardMaterial.js";
import "@babylonjs/loaders/glTF/index.js";
import "@babylonjs/loaders/OBJ/index.js";
import "hammerjs";

export class Game {
    keys: Record<string, boolean> = {};
    levels: Record<string, Level> = {};
    currentLevel: Nullable<Level> = null;
    currentLevelName: string = "HomeMenuLevel";
    onPausedChangedObservable: Observable<boolean> = new Observable();
    canvas: HTMLCanvasElement;
    engine: Engine;

    get scene(): Nullable<Scene> {
        return this.currentLevel?.scene || null;
    }

    constructor(id: string) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.engine = new Engine(this.canvas, true);

        const homeMenuLevel = new HomeMenuLevel(
            this.engine,
            this.onPausedChangedObservable,
        );
        const creditsLevel = new CreditsLevel(
            this.engine,
            this.onPausedChangedObservable,
        );
        const firstLevel = new FirstLevel(
            this.engine,
            this.onPausedChangedObservable,
        );

        homeMenuLevel.onAssetsLoadedObservable.add(() => {
            this.resume();
            this.startRenderLoop();
        });
        homeMenuLevel.onExitStartedObservable.add(() => {
            this.stopRenderLoop();
        });
        homeMenuLevel.onGotoLevelObservable.add((levelName) => {
            this.goToLevel(levelName);
        });
        creditsLevel.onAssetsLoadedObservable.add(() => {
            this.resume();
            this.startRenderLoop();
        });
        creditsLevel.onExitStartedObservable.add(() => {
            this.stopRenderLoop();
        });
        creditsLevel.onGotoLevelObservable.add((levelName) => {
            this.goToLevel(levelName);
        });
        firstLevel.onAssetsLoadedObservable.add(() => {
            this.resume();
            this.startRenderLoop();
        });
        firstLevel.onExitStartedObservable.add(() => {
            this.stopRenderLoop();
        });
        firstLevel.onGotoLevelObservable.add((levelName) => {
            this.goToLevel(levelName);
        });
        firstLevel.onGameOverObservable.add(() => {
            this.pause();
        });
        firstLevel.onReplayObservable.add(() => {
            this.resume();
        });

        this.levels = {
            HomeMenuLevel: homeMenuLevel,
            CreditsLevel: creditsLevel,
            FirstLevel: firstLevel,
        };
    }

    start() {
        this.listenKeys();
        this.listenTouchEvents();
        this.startLevel();
        this.listenOtherEvents();
    }

    pause() {
        this.onPausedChangedObservable.notifyObservers(true);
    }

    resume() {
        this.onPausedChangedObservable.notifyObservers(false);
    }

    listenKeys() {
        document.addEventListener("keydown", this._keyDown.bind(this));
        document.addEventListener("keyup", this._keyUp.bind(this));

        this.keys.up = false;
        this.keys.down = false;
        this.keys.left = false;
        this.keys.right = false;
    }

    private _keyDown(ev: KeyboardEvent) {
        if (ev.key === "ArrowUp" || ev.key === "w") {
            this.keys.up = true;
        } else if (ev.key === "ArrowDown" || ev.key === "s") {
            this.keys.down = true;
        } else if (ev.key === "ArrowLeft" || ev.key === "a") {
            this.keys.left = true;
        } else if (ev.key === "ArrowRight" || ev.key === "d") {
            this.keys.right = true;
        }
    }

    private _keyUp(ev: KeyboardEvent) {
        if (ev.key === "ArrowUp" || ev.key === "w") {
            this.keys.up = false;
        } else if (ev.key === "ArrowDown" || ev.key === "s") {
            this.keys.down = false;
        } else if (ev.key === "ArrowLeft" || ev.key === "a") {
            this.keys.left = false;
        } else if (ev.key === "ArrowRight" || ev.key === "d") {
            this.keys.right = false;
        }
    }

    listenTouchEvents() {
        if (typeof Hammer == "undefined") {
            return;
        }

        const hammertime = new Hammer(document.body);
        hammertime.get("swipe").set({ direction: Hammer.DIRECTION_ALL });

        hammertime.on("swipeup", () => {
            this.keys.up = true;

            setTimeout(() => {
                this.keys.up = false;
            }, 150);
        });

        hammertime.on("swipedown", () => {
            this.keys.down = true;

            setTimeout(() => {
                this.keys.down = false;
            }, 100);
        });

        hammertime.on("swipeleft", () => {
            this.keys.left = true;

            setTimeout(() => {
                this.keys.left = false;
            }, 150);
        });

        hammertime.on("swiperight", () => {
            this.keys.right = true;

            setTimeout(() => {
                this.keys.right = false;
            }, 150);
        });
    }

    listenOtherEvents() {
        window.addEventListener("blur", () => {
            this.pause();
        });

        window.addEventListener("focus", () => {
            this.resume();
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    goToLevel(levelName: string) {
        if (!this.levels[levelName]) {
            console.error(`A level with name ${levelName} doesn't exist`);
            return;
        }

        if (this.currentLevel) {
            this.currentLevel.exit();
        }

        this.currentLevelName = levelName;
        this.startLevel();
    }

    startLevel() {
        this.currentLevel = this.levels[this.currentLevelName];
        this.currentLevel.start();
    }

    render() {
        this.startRenderLoop();
    }

    startRenderLoop() {
        setTimeout(() => {
            this.engine.runRenderLoop(() => {
                this.currentLevel?.scene?.render();
            });
        }, 50);
    }

    stopRenderLoop() {
        this.engine.stopRenderLoop();
    }
}

import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

import { UI } from "../../base/UI.js";
import { Level } from "../../base/Level.js";

export class HomeMenuLevel extends Level {
    protected _camera!: FreeCamera;

    setupAssets() {
        this.assets.addMusic("music", "assets/musics/music.mp3");
    }

    buildScene() {
        this._camera = new FreeCamera(
            "camera1",
            new Vector3(0, 5, -10),
            this.scene,
        );

        // Make this scene transparent to see the document background
        this.scene.clearColor = new Color4(0, 0, 0, 0);

        const menu = new UI("homeMenuUI");

        menu.addButton("playButton", "Play Game", {
            background: "transparent",
            color: "white",
            onClick: () => {
                this.onGotoLevelObservable.notifyObservers("FirstLevel");
            },
        });

        menu.addButton("creditsButton", "Credits", {
            top: "70px",
            background: "transparent",
            color: "white",
            onClick: () => {
                this.onGotoLevelObservable.notifyObservers("CreditsLevel");
            },
        });

        document.getElementById("forkMeOnGithub")!.style.display = "block";
    }

    onExit() {
        document.getElementById("forkMeOnGithub")!.style.display = "none";
    }
}

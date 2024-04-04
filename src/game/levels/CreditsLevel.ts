import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Control } from "@babylonjs/gui/2D/controls/control.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

import { UI } from "../../base/UI.js";
import { Level } from "../../base/Level.js";

export class CreditsLevel extends Level {
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

        // Make this scene transparent to see the background
        this.scene.clearColor = new Color4(0, 0, 0, 0);

        this.makeUI();
    }

    makeUI() {
        const ui = new UI("creditsUI");

        ui.addText(
            "Design and Code by Tiago Silva Pereira Rodrigues\nkingofcode.com.br\n\n\n",
            {
                top: "30px",
                fontSize: "20px",
                // horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_TOP,
                horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
            },
        );

        ui.addText("Music by Eric Matyas\nwww.soundimage.org", {
            top: "140px",
            fontSize: "20px",
            // horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_TOP,
            horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        });

        ui.addText(
            "Rifle model by 3DMaesen (bumstrum) under CC BY 4.0\nhttps://sketchfab.com/bumstrum",
            {
                top: "250px",
                fontSize: "20px",
                // horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_TOP,
                horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
            },
        );

        ui.addText(
            "Skybox Textures from BabylonJS\nhttps://doc.babylonjs.com/resources/playground_textures\n\nPlease check the license documentation before\nchanging the credits",
            {
                top: "360px",
                fontSize: "20px",
                // horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_TOP,
                horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
            },
        );

        ui.addButton("backButton", "Return to Home", {
            top: "0px",
            background: "transparent",
            color: "white",
            onClick: () => {
                this.onGotoLevelObservable.notifyObservers("HomeMenuLevel");
            },
        });
    }
}

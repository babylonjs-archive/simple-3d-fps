import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Sound } from "@babylonjs/core/Audio/sound.js";
import { Tags } from "@babylonjs/core/Misc/tags.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
// import type { Node } from "@babylonjs/core/node.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo.js";

import type { Level } from "../base/Level.js";
import type { FirstLevel } from "./levels/FirstLevel.js";

export class Weapon {
    /** Milliseconds between each fire. */
    fireRate: number;
    canFire: boolean;
    currentFireRate: number;
    shots: number;
    ammo: number;
    fireSound: Sound;
    reloadSound: Sound;
    emptySound: Sound;
    states: Record<string, boolean>;
    level: FirstLevel;
    mesh: Nullable<Mesh> = null;

    constructor(level: Level) {
        this.level = level as FirstLevel;
        this.fireRate = 350;
        this.canFire = true;
        this.currentFireRate = 0;
        this.shots = 0;

        this.ammo = 10;

        this.fireSound = this.level.assets.getSound("shotgun");
        this.reloadSound = this.level.assets.getSound("reload");
        this.emptySound = this.level.assets.getSound("empty");

        this.states = {
            EMPTY: false,
        };
    }

    create() {
        this.mesh = this.level.assets.getAnimatedMesh("rifle")!;
        this.mesh.setEnabled(true);
        this.mesh.isVisible = true;

        // Let's use a transform node to never lose the correct mesh orientation
        // It we apply transformations directly to the mesh, It can be mirrored,
        // removing the handedness conversion
        const transformNode = new TransformNode("weaponTransformNode");

        // transformNode.parent = this.level.camera as any;
        transformNode.parent = this.level.scene.activeCamera;
        transformNode.scaling = new Vector3(3.5, 3.5, 3.5);
        transformNode.position = new Vector3(0.7, -0.45, 1.1);
        this.mesh.parent = transformNode;

        this.controlFireRate();
    }

    fire() {
        if (this.ammo === 1) {
            if (!this.states.EMPTY) {
                this.level.ammoIsOver();
                this.states.EMPTY = true;
            }
        } else if (this.ammo <= 0) {
            this.emptySound.play();
            return;
        }

        const width = this.level.scene.getEngine().getRenderWidth();
        const height = this.level.scene.getEngine().getRenderHeight();

        // Is the player control enabled?
        if (this.level.controlEnabled) {
            const pickInfo = this.level.scene.pick(
                width / 2,
                height / 2,
                undefined,
                false,
                this.level.camera,
            );
            this.doFire(pickInfo);
        }
    }

    doFire(pickInfo: PickingInfo) {
        if (this.canFire) {
            this.ammo--;
            this.shots++;
            this.fireSound.play();
            this.level.updateStats();

            // If we hit an enemy
            if (
                pickInfo.hit &&
                Tags.HasTags(pickInfo.pickedMesh) &&
                Tags.MatchesQuery(pickInfo.pickedMesh, "enemy")
            ) {
                const mainMesh = pickInfo.pickedMesh?.parent
                    ? pickInfo.pickedMesh!.parent
                    : pickInfo.pickedMesh;
                (mainMesh as any).enemyObject.destroy();
            } else {
                if (pickInfo.pickedPoint) {
                    const box = MeshBuilder.CreateBox(
                        "box",
                        { size: 0.1 },
                        this.level.scene,
                    );
                    box.position = pickInfo.pickedPoint.clone();
                }
            }

            this.animateFire();

            this.canFire = false;
        }
    }

    animateFire() {
        // Playing rifle animation from frame 0 to 10
        this.level.assets.playMeshAnimation("rifle", 0, 10);
    }

    reload() {
        this.ammo += 10;
        this.states.EMPTY = false;
        this.level.assets.playMeshAnimation("rifle", 11, 72);
        this.reloadSound.play();
        this.level.updateStats();
    }

    controlFireRate() {
        if (!this.canFire) {
            this.currentFireRate -= this.level.engine.getDeltaTime();

            if (this.currentFireRate <= 0) {
                this.canFire = true;
                this.currentFireRate = this.fireRate;
            }
        }
    }
}

import { Sound } from "@babylonjs/core/Audio/sound.js";
import { Tags } from "@babylonjs/core/Misc/tags.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import type { Nullable } from "@babylonjs/core/types.js";

import { moveObjectTo } from "../base/Helper.js";
import type { Level } from "../base/Level.js";
import type { FirstLevel } from "./levels/FirstLevel.js";

export class Enemy {
    attackSound: Sound;
    defaultAltitude: number;
    maxDistanceFromCenter: number;
    mesh: Nullable<Mesh> = null;
    speed: number;
    states: Record<string, boolean>;
    randPosition: Vector3 = Vector3.Zero();

    constructor(public level: Level) {
        this.maxDistanceFromCenter = (
            level as FirstLevel
        ).enemyDistanceFromCenter;
        this.defaultAltitude = 2.5;
        this.speed = 0.4;

        this.attackSound = this.level.assets.getSound("monsterAttack");

        this.states = {
            DESTROYED: false,
            FOLLOWING: false,
            ATTACKING: false,
            CLOSE_TO_PLAYER: false,
        };

        this.mesh = this.level.assets.getMesh("enemy")!.clone();
        (this.mesh as any).enemyObject = this;
        this.mesh.checkCollisions = true;

        this.mesh.setEnabled(true);
        this.mesh.isVisible = true;

        Tags.AddTagsTo(this.mesh, "enemy");

        this.mesh.position.x = Math.floor(Math.random() * 100) - 50;
        this.mesh.position.z = Math.floor(Math.random() * 100) - 50;
        this.mesh.position.y = this.defaultAltitude;

        this.mesh.scaling = new Vector3(0.25, 0.25, 0.25);

        this.generateRandomPosition();
    }

    move() {
        if (!this.mesh) {
            return;
        } else if (this.states.DESTROYED) {
            return;
        }

        const distanceFromPlayer = this.level
            .camera!.position.subtract(this.mesh.position)
            .length();

        if (distanceFromPlayer <= 5) {
            this.attack(distanceFromPlayer);
        } else if (distanceFromPlayer <= 27) {
            this.followPlayer();
        } else {
            this.gotToRandomDirection();
        }
    }

    followPlayer() {
        this.states.ATTACKING = false;
        this.states.FOLLOWING = true;

        moveObjectTo(this.mesh!, this.level.camera!.position, this.speed);
    }

    attack(distanceFromPlayer: number) {
        this.states.FOLLOWING = false;

        if (!this.states.ATTACKING) {
            this.attackSound.play();
            this.states.ATTACKING = true;
        }

        if (distanceFromPlayer > 3) {
            moveObjectTo(
                this.mesh!,
                this.level.camera!.position,
                this.speed * 2,
            );
        }

        this.checkAttackedThePlayer(distanceFromPlayer);
    }

    /**
     * Let's use a simple logic to check if the user was damaged by the enemy
     * considering the distance from player and the enemy attack mode
     * @param {*} distanceFromPlayer
     */
    checkAttackedThePlayer(distanceFromPlayer: number) {
        if (!this.states.ATTACKING) {
            return;
        }

        if (distanceFromPlayer <= 3.5) {
            if (!this.states.CLOSE_TO_PLAYER) {
                (this.level as FirstLevel).playerWasAttacked();
            }

            this.states.CLOSE_TO_PLAYER = true;
        } else {
            this.states.CLOSE_TO_PLAYER = false;
        }
    }

    gotToRandomDirection() {
        moveObjectTo(this.mesh!, this.randPosition, this.speed);

        // If is close to the destination, generates a new position
        if (this.randPosition.subtract(this.mesh!.position).length() <= 1) {
            this.generateRandomPosition();
        }
    }

    generateRandomPosition() {
        const randomPositionX =
            Math.floor(Math.random() * this.maxDistanceFromCenter) -
            this.maxDistanceFromCenter / 2;
        const randomPositionZ =
            Math.floor(Math.random() * this.maxDistanceFromCenter) -
            this.maxDistanceFromCenter / 2;
        // let altitude = Math.floor(Math.random() * 7);

        this.randPosition = new Vector3(
            randomPositionX,
            this.defaultAltitude,
            randomPositionZ,
        );
    }

    destroy() {
        (this.level as FirstLevel).playerHitEnemy();

        this.states.DESTROYED = true;
        // this.dieSound.play();
        this.level.interpolate(
            this.mesh!.position,
            "y",
            0.5,
            100 * this.mesh!.position.y,
        );

        this.remove();
    }

    remove() {
        if (!this.mesh) {
            return;
        }

        setTimeout(() => {
            this.mesh!.dispose();
            this.mesh = null;
        }, 300);
    }
}

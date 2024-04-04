import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Control } from "@babylonjs/gui/2D/controls/control.js";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import { Sprite } from "@babylonjs/core/Sprites/sprite.js";
import { SpriteManager } from "@babylonjs/core/Sprites/spriteManager.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

import { Enemy } from "../Enemy.js";
import { UI } from "../../base/UI.js";
import { Weapon } from "../Weapon.js";
import { Player } from "../Player.js";
import { Level } from "../../base/Level.js";
import { options } from "../../options.js";

export class FirstLevel extends Level {
    menu!: UI;
    weapon!: Weapon;
    ammoBox!: Mesh;
    player!: Player;
    playerLife = 100;
    maxEnemies = 10;
    currentEnemies = 0;
    enemies: Enemy[] = [];
    enemyDistanceFromCenter = 100;
    lifeTextControl!: TextBlock;
    ammoTextControl!: TextBlock;
    hitsTextControl!: TextBlock;
    pointsTextControl!: TextBlock;
    currentRecordTextControl!: TextBlock;
    hasMadeRecordTextControl!: TextBlock;
    gameOverTextControl!: TextBlock;

    onGameOverObservable = new Observable<void>();
    onReplayObservable = new Observable<void>();

    setProperties() {
        // Player
        this.player = new Player(this);
        this.playerLife = 100;

        // Enemies
        this.maxEnemies = 10;
        this.currentEnemies = 0;
        this.enemies = [];
        this.enemyDistanceFromCenter = 100;
    }

    setupAssets() {
        this.assets.addAnimatedMesh(
            "rifle",
            "assets/models/weapons/rifle/",
            "rifle.gltf",
            {
                normalized: true, // Normalize all rifle animations
                start: 0,
                end: 207,
            },
        );

        this.assets.addMergedMesh(
            "enemy",
            "assets/models/skull/",
            "skull2.obj",
        );

        this.assets.addMusic("music", "assets/musics/music.mp3", {
            volume: 0.1,
        });
        this.assets.addSound("shotgun", "assets/sounds/shotgun.wav", {
            volume: 0.4,
        });
        this.assets.addSound("reload", "assets/sounds/reload.mp3", {
            volume: 0.4,
        });
        this.assets.addSound("empty", "assets/sounds/empty.wav", {
            volume: 0.4,
        });
        this.assets.addSound(
            "monsterAttack",
            "assets/sounds/monster_attack.wav",
            { volume: 0.3 },
        );
        this.assets.addSound("playerDamaged", "assets/sounds/damage.wav", {
            volume: 0.3,
        });
    }

    buildScene() {
        this.scene.clearColor = Color4.FromHexString("#777");

        // Adding lights
        const dirLight = new DirectionalLight(
            "DirectionalLight",
            new Vector3(0, -1, 0),
            this.scene,
        );
        dirLight.intensity = 0.3;

        const hemiLight = new HemisphericLight(
            "HemiLight",
            new Vector3(0, 1, 0),
            this.scene,
        );
        hemiLight.intensity = 0.5;

        // Skybox
        const skybox = MeshBuilder.CreateBox(
            "skyBox",
            { size: 1000 },
            this.scene,
        );
        const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture(
            "assets/skybox/skybox",
            this.scene,
        );
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;

        this.scene.gravity = new Vector3(0, -9.81, 0);
        this.scene.collisionsEnabled = true;

        // Create and set the active camera
        this.camera = this.createCamera();
        this.scene.activeCamera = this.camera!;
        this.enablePointerLock();

        this.createGround();
        this.addWeapon();
        this.addEnemies();

        this.createHUD();
        this.createMenu();

        setInterval(() => {
            this.addEnemies();
        }, 1000 * 25);

        this.setupEventListeners();

        this.player.startTimeCounter();
    }

    createGround() {
        const ground = MeshBuilder.CreateGround(
            "ground",
            { width: 500, height: 500, subdivisions: 2 },
            this.scene,
        );
        ground.checkCollisions = true;

        const groundMaterial = new StandardMaterial(
            "groundMaterial",
            this.scene,
        );
        groundMaterial.diffuseTexture = new Texture(
            "assets/images/sand.jpg",
            this.scene,
        );
        groundMaterial.specularColor = new Color3(0, 0, 0);

        ground.material = groundMaterial;
    }

    addWeapon() {
        this.weapon = new Weapon(this);
        this.weapon.create();
    }

    addEnemies() {
        // Let's remove unnecessary enemies to prevent performance issues
        this.removeUnnecessaryEnemies();

        const count = this.maxEnemies - this.currentEnemies;

        for (let i = 0; i < count; i++) {
            const enemy = new Enemy(this);

            this.enemies.push(enemy);
            this.currentEnemies++;
        }

        // Increasing the quantity of max enemies
        this.maxEnemies += 1;
        this.enemyDistanceFromCenter += 10;
    }

    removeUnnecessaryEnemies() {
        const enemiesQuantity = this.enemies.length;

        for (let i = 0; i < enemiesQuantity; i++) {
            if (this.enemies[i] && !this.enemies[i].mesh) {
                this.enemies.splice(i, 1);
            }
        }
    }

    setupEventListeners() {
        this.engine.getRenderingCanvas()!.addEventListener(
            "click",
            () => {
                if (this.weapon) {
                    this.weapon.fire();
                }
            },
            false,
        );
    }

    createHUD() {
        const hud = new UI("levelUI");

        const gunsight = hud.addImage(
            "gunsight",
            "assets/images/gunsight.png",
            {
                width: 0.05,
                height: 0.05,
            },
        );
        gunsight.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        gunsight.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        this.lifeTextControl = hud.addText("Life: " + this.playerLife, {
            top: "10px",
            left: "10px",
            horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_LEFT,
        });

        this.ammoTextControl = hud.addText("Ammo: " + this.weapon.ammo, {
            top: "10px",
            left: "10px",
            horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_CENTER,
        });

        this.hitsTextControl = hud.addText("Hits: " + this.player.hits, {
            top: "10px",
            left: "-10px",
            horizontalAlignment: Control.HORIZONTAL_ALIGNMENT_RIGHT,
        });
    }

    createMenu() {
        this.menu = new UI("runnerMenuUI");

        this.pointsTextControl = this.menu.addText("Points: 0", {
            top: "-200px",
            outlineWidth: "2px",
            fontSize: "40px",
            verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        this.currentRecordTextControl = this.menu.addText("Current Record: 0", {
            top: "-150px",
            verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        this.hasMadeRecordTextControl = this.menu.addText(
            "You got a new Points Record!",
            {
                top: "-100px",
                color: options.recordTextColor,
                fontSize: "20px",
                verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
            },
        );

        this.gameOverTextControl = this.menu.addText("GAME OVER", {
            top: "-60px",
            color: options.recordTextColor,
            fontSize: "25px",
            verticalAlignment: Control.VERTICAL_ALIGNMENT_CENTER,
        });

        this.menu.addButton("replayButton", "Replay Game", {
            onClick: () => {
                this.replay();
            },
        });

        this.menu.addButton("backButton", "Return to Home", {
            top: "70px",
            onClick: () => {
                this.onGotoLevelObservable.notifyObservers("HomeMenuLevel");
            },
        });

        this.menu.hide();
    }

    createCamera() {
        const camera = new UniversalCamera(
            "UniversalCamera",
            new Vector3(0, 3.5, 100),
            this.scene,
        );
        camera.setTarget(new Vector3(0, 2, 0));

        camera.attachControl(this.engine.getRenderingCanvas()!, true);

        camera.applyGravity = true;
        camera.ellipsoid = new Vector3(1, 1.7, 1);
        camera.checkCollisions = true;
        (camera as any)._needMoveForGravity = true;

        this.addEnemies();

        // Reducing the minimum visible FOV to show the Weapon correctly
        camera.minZ = 0;

        // Remap keys to move with WASD
        camera.keysUp = [87, 38]; // W or UP Arrow
        camera.keysDown = [83, 40]; // S or DOWN ARROW
        camera.keysLeft = [65, 37]; // A or LEFT ARROW
        camera.keysRight = [68, 39]; // D or RIGHT ARROW

        camera.inertia = 0.1;
        camera.angularSensibility = 800;
        camera.speed = 17;

        camera.onCollide = (collidedMesh) => {
            // If the camera collides with the ammo box
            if (collidedMesh.id == "ammoBox") {
                this.weapon.reload();
                collidedMesh.dispose();
                (collidedMesh as any).arrow?.dispose();
            }
        };

        return camera;
    }

    playerWasAttacked() {
        this.playerLife -= 5;

        if (this.playerLife <= 0) {
            this.playerLife = 0;
            this.lifeTextControl.text = "Life: " + this.playerLife;

            this.gameOver();

            return;
        }

        this.lifeTextControl.text = "Life: " + this.playerLife;
        this.assets.getSound("playerDamaged").play();
    }

    playerHitEnemy() {
        this.currentEnemies--;
        this.player.hits++;
        this.hitsTextControl.text = "Hits: " + this.player.hits;
    }

    ammoIsOver() {
        // Create a new ammo package that, if collided, recharge the ammo
        this.addAmmoBox();
    }

    addAmmoBox() {
        this.ammoBox = MeshBuilder.CreateBox(
            "ammoBox",
            { width: 4, height: 2, depth: 2 },
            this.scene,
        );

        this.ammoBox.position.x = 0;
        this.ammoBox.position.y = 1;
        this.ammoBox.position.z = 0;

        this.ammoBox.checkCollisions = true;

        // Let's add a green arrow to show where is the ammo box
        const arrowSpriteManager = new SpriteManager(
            "arrowSpriteManager",
            "assets/images/arrow.png",
            1,
            256,
            this.scene,
        );
        (this.ammoBox as any).arrow = new Sprite("arrow", arrowSpriteManager);
        (this.ammoBox as any).arrow.position.y = 5;
        (this.ammoBox as any).arrow.size = 4;
    }

    updateStats() {
        this.lifeTextControl.text = "Life: " + this.playerLife;
        this.ammoTextControl.text = "Ammo: " + this.weapon.ammo;
        this.hitsTextControl.text = "Hits: " + this.player.hits;
    }

    gameOver() {
        this.onGameOverObservable.notifyObservers();

        this.player.stopTimeCounter();
        this.player.calculatePoints();

        this.showMenu();
        this.exitPointerLock();
        this.enemies.forEach((enemy) => enemy.remove());
        this.removeUnnecessaryEnemies();

        if (this.ammoBox) {
            (this.ammoBox as any).arrow.dispose();
            this.ammoBox.dispose();
        }
    }

    showMenu() {
        this.pointsTextControl.text = "Points: " + this.player.getPoints();
        this.currentRecordTextControl.text = `Current Record: ${this.player.getLastRecord()}`;
        this.menu.show();

        if (this.player.hasMadePointsRecord()) {
            this.hasMadeRecordTextControl.isVisible = true;
        } else {
            this.hasMadeRecordTextControl.isVisible = false;
        }
    }

    replay() {
        this.playerLife = 100;
        this.player.hits = 0;

        this.maxEnemies = 10;
        this.currentEnemies = 0;
        this.enemies = [];
        this.enemyDistanceFromCenter = 100;

        this.updateStats();
        this.onReplayObservable.notifyObservers();
        this.menu.hide();

        this.camera!.position = new Vector3(0, 3.5, 100);
        this.weapon.reload();
        this.addEnemies();

        this.player.startTimeCounter();
    }

    beforeRender() {
        if (!this.paused) {
            this.weapon.controlFireRate();
            for (const enemy of this.enemies) {
                enemy.move();
            }

            if (this.camera!.position.y < -20) {
                this.gameOver();
            }
        }
    }
}

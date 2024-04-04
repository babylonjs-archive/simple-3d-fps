import { ActionManager } from "@babylonjs/core/Actions/actionManager.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions.js";
import { InterpolateValueAction } from "@babylonjs/core/Actions/interpolateValueAction.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import { Scene } from "@babylonjs/core/scene.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Tags } from "@babylonjs/core/Misc/tags.js";
import type { Camera } from "@babylonjs/core/Cameras/camera.js";
import type { Engine } from "@babylonjs/core/Engines/engine.js";
import type { Nullable } from "@babylonjs/core/types.js";

import { AssetsDatabase } from "./AssetsDatabase.js";

export class Level {
    scene!: Scene;
    assets!: AssetsDatabase;
    onAssetsLoadedObservable = new Observable<void>();
    onExitStartedObservable = new Observable<void>();
    onGotoLevelObservable = new Observable<string>();
    controlEnabled = false;

    constructor(
        public engine: Engine,
        onPausedChangedObservable: Observable<boolean>,
    ) {
        onPausedChangedObservable.add((paused) => {
            this.paused = paused;
        });
    }

    protected setProperties?(): void;
    protected buildScene?(): void;
    protected beforeRender?(): void;
    protected setupAssets?(): void;
    protected onExit?(): void;
    protected paused = false;
    protected locked = false;

    camera?: Camera;

    start() {
        if (this.setProperties) {
            this.setProperties();
        }

        this.createScene();
    }

    createScene() {
        // Create the scene space
        this.scene = new Scene(this.engine);

        // Add assets management and execute beforeRender after finish
        this.assets = new AssetsDatabase(this.scene, () => {
            if (this.buildScene) {
                this.buildScene();
            }

            if (this.beforeRender) {
                this.scene.registerBeforeRender(this.beforeRender.bind(this));
            }

            this.onAssetsLoadedObservable.notifyObservers();
        });

        if (this.setupAssets) {
            this.setupAssets();
        }

        this.assets.load();

        return this.scene;
    }

    exit() {
        // Fix to blur the canvas to avoid issues with keyboard input
        this.engine.getRenderingCanvas()?.blur();

        this.onExitStartedObservable.notifyObservers();

        if (this.onExit) {
            this.onExit();
        }

        this.scene.dispose();
    }

    /**
     * Adds a collider to the level scene. It will fire the options.onCollide callback
     * when the collider intersects options.collisionMesh. It can be used to fire actions when
     * player enters an area for example.
     * @param {*} name
     * @param {*} options
     */
    addCollider(name: string, options: any) {
        const collider = MeshBuilder.CreateBox(
            name,
            {
                width: options.width || 1,
                height: options.height || 1,
                depth: options.depth || 1,
            },
            this.scene,
        );

        // Add a tag to identify the object as collider and to simplify group operations (like dispose)
        Tags.AddTagsTo(collider, "collider boxCollider");

        collider.position.x = options.positionX || 0;
        collider.position.y = options.positionY || 0;
        collider.position.z = options.positionZ || 0;

        collider.isVisible = options.visible ? options.visible : false;

        if (collider.isVisible) {
            const colliderMaterial = new StandardMaterial(name + "Material");
            colliderMaterial.diffuseColor = new Color3(0.5, 0.5, 0);
            colliderMaterial.alpha = 0.5;

            collider.material = colliderMaterial;
        }

        options.timeToDispose = options.timeToDispose
            ? options.timeToDispose
            : 0;

        collider.actionManager = new ActionManager(this.scene);
        collider.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: options.collisionMesh,
                },
                () => {
                    // Runs onCollide callback if exists
                    if (options.onCollide) {
                        options.onCollide();
                    }

                    // If true, will dispose the collider after timeToDispose
                    if (options.disposeAfterCollision) {
                        setTimeout(() => {
                            collider.dispose();
                        }, options.timeToDispose);
                    }
                },
            ),
        );

        return collider;
    }

    disposeColliders() {
        let colliders = this.scene.getMeshesByTags("collider");

        for (var index = 0; index < colliders.length; index++) {
            colliders[index].dispose();
        }
    }

    /**
     * Interpolate a value inside the Level Scene using the BABYLON Action Manager
     * @param {*} target The target object
     * @param {*} property The property in the object to interpolate
     * @param {*} toValue The final value of interpolation
     * @param {*} duration The interpolation duration in milliseconds
     * @param {*} afterExecutionCallback Callback executed after ther interpolation ends
     */
    interpolate(
        target: any,
        property: string,
        toValue: any,
        duration: number,
        afterExecutionCallback: Nullable<() => void> = null,
    ) {
        if (!this.scene.actionManager) {
            this.scene.actionManager = new ActionManager(this.scene);
        }

        const interpolateAction = new InterpolateValueAction(
            ActionManager.NothingTrigger,
            target,
            property,
            toValue,
            duration,
        );

        interpolateAction.onInterpolationDoneObservable.add(() => {
            if (afterExecutionCallback) {
                afterExecutionCallback();
            }
        });

        this.scene.actionManager.registerAction(interpolateAction);
        interpolateAction.execute();
    }

    enablePointerLock() {
        const canvas = this.engine.getRenderingCanvas()!;

        this.scene.onPointerDown = async () => {
            if (document.pointerLockElement !== canvas) {
                if (!this.locked) {
                    canvas.requestPointerLock =
                        canvas.requestPointerLock ||
                        canvas.msRequestPointerLock ||
                        canvas.mozRequestPointerLock ||
                        canvas.webkitRequestPointerLock ||
                        false;

                    if (canvas.requestPointerLock) {
                        await canvas.requestPointerLock();
                    }
                }
            }

            const pointerlockchange = () => {
                this.controlEnabled = !!document.pointerLockElement;

                if (!this.controlEnabled) {
                    this.camera?.detachControl(canvas);
                    this.locked = false;
                } else {
                    this.camera?.attachControl(canvas);
                    this.locked = true;
                }
            };
            // Attach events to the document
            document.addEventListener(
                "pointerlockchange",
                pointerlockchange,
                false,
            );
            document.addEventListener(
                "mspointerlockchange",
                pointerlockchange,
                false,
            );
            document.addEventListener(
                "mozpointerlockchange",
                pointerlockchange,
                false,
            );
            document.addEventListener(
                "webkitpointerlockchange",
                pointerlockchange,
                false,
            );
        };
    }

    exitPointerLock() {
        this.camera?.detachControl();
        document.exitPointerLock();
    }
}

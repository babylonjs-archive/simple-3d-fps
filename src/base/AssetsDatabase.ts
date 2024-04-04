import { AssetsManager } from "@babylonjs/core/Misc/assetsManager.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Sound } from "@babylonjs/core/Audio/sound.js";
import type { AbstractAssetTask } from "@babylonjs/core/Misc/assetsManager.js";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup.js";
import type { ISoundOptions } from "@babylonjs/core/Audio/Interfaces/ISoundOptions.js";
import type { MeshAssetTask } from "@babylonjs/core/Misc/assetsManager.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { Scene } from "@babylonjs/core/scene.js";

import { log } from "./Log.js";

export type CallbackFn = (tasks: AbstractAssetTask[]) => void;

export interface MeshOptions {
    normalized?: boolean;
    start?: number;
    startFrame?: number;
    end?: number;
    endFrame?: number;
    onSuccess?: (mesh: Mesh) => void;
}

export interface SoundOptions extends ISoundOptions {
    onSuccess?: (sound: Sound) => void;
}

export class AssetsDatabase {
    manager: AssetsManager;
    meshes: Record<string, Mesh>;
    sounds: Record<string, Sound>;
    animatedMeshes: Record<string, Mesh>;
    animationGroups: WeakMap<Mesh, AnimationGroup[]> = new WeakMap();

    constructor(
        public scene: Scene,
        finishCallback?: (tasks: AbstractAssetTask[]) => void,
    ) {
        this.scene = scene;

        this.meshes = {};
        this.sounds = {};
        this.animatedMeshes = {};

        this.manager = new AssetsManager(this.scene);

        this.manager.onFinish = (tasks) => {
            if (finishCallback) {
                finishCallback(tasks);
            }
        };
    }

    addSound(name: string, file: string, options: Partial<SoundOptions> = {}) {
        const fileTask = this.manager.addBinaryFileTask(
            name + "__SoundTask",
            file,
        );

        fileTask.onSuccess = (task) => {
            this.sounds[name] = new Sound(
                name,
                task.data,
                this.scene,
                null,
                options,
            );

            if (options.onSuccess) {
                options.onSuccess(this.sounds[name]);
            }
        };

        return this.sounds[name];
    }

    /**
     * Adds a music (sound with some predefined parametes that can be overwriten)
     * By default, musics are automatically played in loop
     * @param {*} name
     * @param {*} file
     * @param {*} options
     */
    addMusic(name: string, file: string, options: Partial<SoundOptions> = {}) {
        const newOptions = {
            loop: true,
            volume: 0.5,
            autoplay: true,
            ...options,
        };
        return this.addSound(name, file, newOptions);
    }

    addMergedMesh(
        name: string,
        base: string,
        file: string,
        options: MeshOptions = {},
    ) {
        return this.addMesh(name, base, file, options, true);
    }

    addMesh(
        name: string,
        base: string,
        file: string,
        options: MeshOptions = {},
        mergeMeshes: boolean = false,
    ) {
        // const fileTask = this.manager.addMeshTask(name + "__MeshTask", "", file);
        const fileTask = this.manager.addMeshTask(
            `${name}__MeshTask`,
            "",
            base,
            file,
        );

        fileTask.onSuccess = (task) => {
            let mesh: Nullable<Mesh> = null;

            try {
                if (mergeMeshes) {
                    mesh = Mesh.MergeMeshes(task.loadedMeshes as Mesh[]);
                } else {
                    mesh = task.loadedMeshes[0] as Mesh;
                }

                mesh!.setEnabled(false);

                this.meshes[name] = mesh!;

                // Execute a success callback
                if (options.onSuccess) {
                    options.onSuccess(this.meshes[name]);
                }
            } catch (error) {
                console.error(error);
            }
        };

        return this.meshes[name];
    }

    addAnimatedMesh(
        name: string,
        base: string,
        file: string,
        options: MeshOptions = {},
    ) {
        const fileTask = this.manager.addMeshTask(
            `${name}__AnimatedMeshTask`,
            "",
            base,
            file,
        );

        fileTask.onSuccess = (task) => {
            try {
                const mesh = task.loadedMeshes[0] as Mesh;
                mesh.setEnabled(false);

                this.animatedMeshes[name] = this.buildAnimatedMeshData(
                    mesh,
                    task,
                    options,
                );

                // Execute a success callback
                if (options.onSuccess) {
                    options.onSuccess(this.animatedMeshes[name]);
                }
            } catch (error) {
                // TODO: Log
                console.error(error);
            }
        };

        return this.animatedMeshes[name];
    }

    buildAnimatedMeshData(
        mesh: Mesh,
        task: MeshAssetTask,
        options: MeshOptions = {},
    ) {
        let start = 0;
        let end = 0;

        if (options?.start || options?.startFrame) {
            start = options.startFrame
                ? options.startFrame / 30
                : options.start!;
            end = options.endFrame ? options.endFrame / 30 : options.end!;
        }

        this.animationGroups.set(mesh, task.loadedAnimationGroups);

        for (const animationGroup of task.loadedAnimationGroups) {
            if (options.normalized) {
                animationGroup.normalize(start, end);
            }

            animationGroup.pause();
        }

        return mesh;
    }

    playMeshAnimation(
        meshName: string,
        start: number,
        end: number,
        loop = false,
    ) {
        const mesh = this.getAnimatedMesh(meshName);

        start = start / 30;
        end = end / 30;

        const animationGroups = this.animationGroups.get(mesh!)!;
        for (const animationGroup of animationGroups) {
            animationGroup.stop();
            animationGroup.start(loop, 1, start, end);
        }
    }

    getMesh(name: string) {
        if (!this.meshes[name]) {
            log.debugError('There is no mesh called "' + name + '"');
            return;
        }

        return this.meshes[name];
    }

    getAnimatedMesh(name: string) {
        if (!this.animatedMeshes[name]) {
            log.debugError('There is no animated mesh called "' + name + '"');
            return;
        }

        return this.animatedMeshes[name];
    }

    getSound(name: string) {
        return this.sounds[name];
    }

    load() {
        this.manager.load();
    }
}

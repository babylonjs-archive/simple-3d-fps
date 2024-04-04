import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

export function moveObjectTo(
    object: AbstractMesh,
    toPosition: Vector3,
    speed = 1,
) {
    const direction = toPosition.subtract(object.position).normalize();
    const alpha = Math.atan2(-1 * direction.x, -1 * direction.z);

    object.rotation.y = alpha;

    object.moveWithCollisions(direction.multiplyByFloats(speed, speed, speed));
}

export function moveObjectBackFrom(
    object: AbstractMesh,
    fromPosition: Vector3,
    speed = 1,
) {
    moveObjectTo(object, fromPosition, -speed);
}

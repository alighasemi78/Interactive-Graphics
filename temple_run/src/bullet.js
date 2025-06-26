import * as THREE from "three";

export class Bullet {
    constructor(scene, position) {
        this.scene = scene;

        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: "yellow" });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);

        this.scene.add(this.mesh);

        this.bulletBox = new THREE.Box3().setFromObject(this.mesh);

        this.direction = new THREE.Vector3(0, 0, -1);
        this.speed = 0.5;

        this.gravity = -0.2;
    }

    handleBulletHit() {
        this.scene.remove(this.mesh);
    }

    update(road) {
        const velocity = this.direction.clone().multiplyScalar(this.speed);
        velocity.y += this.gravity;
        this.mesh.position.add(velocity);

        this.bulletBox.setFromObject(this.mesh);

        road.checkBulletCollision(
            this.bulletBox,
            this.handleBulletHit.bind(this)
        );
    }

    isOutOfBounds(maxDistance = 100) {
        return this.mesh.position.length() > maxDistance;
    }
}

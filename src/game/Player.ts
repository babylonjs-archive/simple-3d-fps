import type { Nullable } from "@babylonjs/core/types.js";
import type { Level } from "../base/Level.js";
import type { FirstLevel } from "./levels/FirstLevel.js";

export class Player {
    hits: number;
    points: number;
    pointsRecord: boolean;
    initialTime: Nullable<Date>;
    endTime: Nullable<Date>;
    elapsedTime: number;

    constructor(public level: Level) {
        this.hits = 0;

        this.points = 0;
        this.pointsRecord = false;

        this.initialTime = null;
        this.endTime = null;
        this.elapsedTime = 0;
    }

    startTimeCounter() {
        this.initialTime = new Date();
        this.elapsedTime = 0;
    }

    stopTimeCounter() {
        this.endTime = new Date();
        this.elapsedTime =
            (this.endTime.getTime() - this.initialTime!.getTime()) / 1000;
    }

    getPoints() {
        return this.points;
    }

    calculatePoints() {
        const elapsedTime = this.elapsedTime || 1;

        this.points = this.hits * 100;
        this.points =
            elapsedTime < this.points ? this.points - elapsedTime : this.points;
        this.points = this.points - (this.level as FirstLevel).weapon.shots;

        this.points = parseInt(String(this.points), 10);

        this.points = this.points > 0 ? this.points : this.hits;

        this.checkAndSaveRecord(this.points);

        return this.points;
    }

    checkAndSaveRecord(points: number) {
        let lastRecord = 0;

        this.pointsRecord = false;

        if (window.localStorage["last_record"]) {
            lastRecord = parseInt(window.localStorage["last_record"], 10);
        }

        if (lastRecord < points) {
            this.pointsRecord = true;
            window.localStorage["last_record"] = points;
        }
    }

    hasMadePointsRecord() {
        return this.pointsRecord;
    }

    getLastRecord() {
        return window.localStorage["last_record"] || 0;
    }
}

import { Room, Client } from "colyseus.js";
import { SceneManager } from "../src/logic/Scene.logic";

export function requestJoinOptions(this: Client, i: number) {
    return { requestNumber: i };
}

export async function onJoin(this: Room) {
    console.log(this.sessionId, "joined.");
    getScene();
    this.onMessage("*", (type, message) => {
        console.log(this.sessionId, "received:", type, message);
    });
}

export function onLeave(this: Room) {
    console.log(this.sessionId, "left.");
}

export function onError(this: Room, err: any) {
    console.log(this.sessionId, "!! ERROR !!", err.message);
}

export function onStateChange(this: Room, state: any) {
    console.log(this.sessionId, "new state:", state);
}

async function getScene() {
    const scene = await SceneManager.getSceneById("00000000-0000-0000-0000-000000000000");
    const builtScene = await SceneManager.buildScene(scene);
    console.log(builtScene)
}
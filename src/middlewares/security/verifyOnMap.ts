import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { MARGIN_OF_ERROR, PeerResponse } from "../utils";
import { ensureHttps } from "./securityChecks";
import { fetch } from "cross-fetch";

// validate that the player is active in a catalyst server, and in the indicated coordinates, or within a margin of error
export async function checkPlayer(playerId: string, server: string, parcel: number[], attempts: number = 0): Promise<boolean> {
  let url = ensureHttps(server + "/comms/peers/");

  if (!server) {
    url = `https://peer.decentraland.org/comms/peers`
  }

  try {
    const response = await fetch(url);
    const data: PeerResponse = await response.json();
    if (data.ok) {
      const player = data.peers.find((peer) => peer.address && peer.address.toLowerCase() === playerId.toLowerCase());

      if (!player.parcel) {
        return false;
      }

      return player && checkCoords(player.parcel, parcel);
    }
  } catch (error: any | { message: string; type: string }) {
    if (error.type == "invalid-json") {
      attempts++;
      if (attempts > 3) {
        AdminLogManager.logError(error, { text: `Got invalid JSON response after ${attempts} attempts.`, from: "verifyOnMap/checkPlayer", request: { playerId, server, parcel } });
        return true;
      }
      AdminLogManager.logError(error, { text: `Got invalid JSON response on attempt ${attempts}`, from: "verifyOnMap/checkPlayer" });
      checkPlayer(playerId, server, parcel, attempts);
    } else {
      AdminLogManager.logError(error, { text: "Failed to check player status!", from: "verifyOnMap/checkPlayer" });
      return true;
    }
  }

  return false;
}

// check coordinates against a single parcel - within a margin of error
export function checkCoords(coords: number[], parcel: number[]) {
  try {
    const validMargin = (p: number, c: number) => Math.abs(p - c) <= MARGIN_OF_ERROR;
    return validMargin(coords[0], parcel[0]) && validMargin(coords[1], parcel[1]);
  } catch (error) {
    AdminLogManager.logError(error, { text: "Failed to check coordinates!", from: "verifyOnMap/checkCoords" });
    return false;
  }
}

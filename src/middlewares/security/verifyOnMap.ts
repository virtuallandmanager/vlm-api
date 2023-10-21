import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { MARGIN_OF_ERROR, PeerResponse } from "../utils";
import { ensureHttps } from "./securityChecks";
import { fetch } from "cross-fetch";

// validate that the player is active in a catalyst server, and in the indicated coordinates, or within a margin of error
export async function checkPlayer(playerId: string, server: string, parcel: number[], attempts: number = 0): Promise<boolean> {

  return true;
  // DCL broke the peer API with the addition of the main realm, so this is disabled for now.
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
      return false;
    }
  }

  return false;
}

// check coordinates against a single parcel - within a margin of error
export function checkCoords(coords: number[], parcel: number[]) {
  try {
    console.log(coords, parcel);
    const validMargin = (p: number, c: number) => Math.abs(p - c) <= MARGIN_OF_ERROR;
    return validMargin(coords[0], parcel[0]) && validMargin(coords[1], parcel[1]);
  } catch (error) {
    AdminLogManager.logError(error, { text: "Failed to check coordinates!", from: "verifyOnMap/checkCoords" });
    return false;
  }
}

export function checkSceneParcels(parcels: string[], coordinate: number[], parcel: number[]) {
  try {
    // check if the parcel is in the list of parcels
    const parcelString = parcel.join(",");
    const coordinateString = coordinate.join(",");
    return parcels.includes(parcelString) && parcels.includes(coordinateString);
  } catch (error) {
    AdminLogManager.logError(error, { text: "Failed to check scene parcels!", from: "verifyOnMap/checkSceneParcels" });
    return false;
  }
}

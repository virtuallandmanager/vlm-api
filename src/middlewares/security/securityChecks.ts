import { Request } from "express";
import dcl from "decentraland-crypto-middleware";
import { denyListedIPS, TESTS_ENABLED, Metadata } from "../utils";
import { checkCoords, checkPlayer, checkSceneParcels } from "./verifyOnMap";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";
import { SceneManager } from "../../logic/Scene.logic";
import { Metaverse } from "../../models/Metaverse.model";

export function checkOrigin(req: Request) {
  try {
    const origin = req.header("origin");

    const regexes = [/^https:\/\/([a-z0-9]+\.)?decentraland\.org\/?$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg\/?$/];
    if (TESTS_ENABLED) {
      regexes.push(/^http:\/\/localhost:\d+\/?$/, /^https:\/\/localhost:\d+\/?$/, /^http:\/\/\d+.\d+.\d+.\d+:\d+\/?$/);
    }

    return regexes.some((regex) => regex.test(origin));
  } catch (error) {
    AdminLogManager.logExternalError("NOTICED MISSING ORIGIN!", req.body);
    return false;
  }
}

export function ensureHttps(url: string) {
  try {
    let newUrl = url;
    if (newUrl.startsWith("http://")) {
      return newUrl.replace("http://", "https://");
    } else if (!newUrl.startsWith("https://") || !newUrl.includes("http")) {
      return "https://" + newUrl;
    }
    return newUrl;
  } catch (error) {
    AdminLogManager.logExternalError("NOTICED MISSING HTTPS!", { url });
    return url;
  }
}

export function checkBannedIPs(req: Request) {
  const ip = req.header("X-Forwarded-For");
  return denyListedIPS.includes(ip);
}

export async function runChecks(req: Request & dcl.DecentralandSignatureData<Metadata>, parcel?: number[], sceneId?: string) {
  const metadata = req.authMetadata;
  const userAddress = req.auth;
  const coordinates = metadata.parcel.split(",").map((item: string) => {
    return parseInt(item, 10);
  });
  let base = metadata.realm.domain || metadata.realm.hostname || "";

  if (!base) {
    AdminLogManager.logExternalError("NOTICED MISSING DCL METADATA!", req.body);
    return;
  } else if (TESTS_ENABLED) {
    // return;
  } else {
    base = ensureHttps(base);
  }

  const scene = await SceneManager.getSceneById(sceneId);
  const locationParcels = scene?.locations.map((location: Metaverse.Location) => location.parcels).flat();

  // check that the request comes from a decentraland domain
  const validOrigin = TESTS_ENABLED || checkOrigin(req);
  if (!validOrigin) {
    throw new Error("INVALID ORIGIN");
  }

  // filter against a denylist of malicious ips
  const validIP = checkBannedIPs(req);
  if (validIP) {
    AdminLogManager.logExternalError("NOTICED BANNED IP!", req.body);
    throw new Error("INVALID IP");
  }

  // Validate that the authchain signature is real
  // validate that the player is in the catalyst & location from the signature
  const validCatalystPos: boolean = (TESTS_ENABLED || req.body.environment == "dev") ? true : await checkPlayer(userAddress, base, coordinates);
  if (!validCatalystPos) {
    AdminLogManager.logExternalError("NOTICED INVALID CATALYST POSITION!", req.body);
    throw new Error("INVALID PLAYER POSITION");
  }

  // validate that the player is in a valid location for this operation - if a parcel is provided
  const validPos: boolean = parcel?.length ? checkCoords(coordinates, parcel) && checkSceneParcels(locationParcels, coordinates, parcel) : true;

  if (!validPos) {
    AdminLogManager.logExternalError("NOTICED INVALID PARCEL POSITION!", req.body);
    throw new Error("INVALID PARCEL POSITION");
  }
}

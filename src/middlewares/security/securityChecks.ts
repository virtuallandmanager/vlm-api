import { Request } from "express";
import dcl from "decentraland-crypto-middleware";
import { denyListedIPS, TESTS_ENABLED, Metadata } from "../utils";
import { checkCoords, checkPlayer } from "./verifyOnMap";
import { AdminLogManager } from "../../logic/ErrorLogging.logic";

export function checkOrigin(req: Request) {
  const origin = req.header("origin");

  const regexes = [/^https:\/\/([a-z0-9]+\.)?decentraland\.org\/?$/, /^https:\/\/([a-z0-9]+\.)?vlm\.gg\/?$/];
  if (TESTS_ENABLED) {
    regexes.push(/^http:\/\/localhost:\d+\/?$/, /^https:\/\/localhost:\d+\/?$/, /^http:\/\/\d+.\d+.\d+.\d+:\d+\/?$/);
  }

  return regexes.some((regex) => regex.test(origin));
}

export function ensureHttps(url: string) {
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  } else if (!url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

export function checkBannedIPs(req: Request) {
  const ip = req.header("X-Forwarded-For");
  return denyListedIPS.includes(ip);
}

export async function runChecks(req: Request & dcl.DecentralandSignatureData<Metadata>, parcel?: number[]) {
  const metadata = req.authMetadata;
  const userAddress = req.auth;
  const coordinates = metadata.parcel.split(",").map((item: string) => {
    return parseInt(item, 10);
  });
  const base = metadata.realm.domain || metadata.realm.hostname || "";
  console.log("BASE: " + base);

  if (!base) {
    AdminLogManager.logExternalError("NOTICED MISSING DCL METADATA!", { req });
    return;
  } else if (TESTS_ENABLED) {
    // return;
  } else {
    ensureHttps(base);
  }

  console.log(`metadata parcel: ${metadata.parcel} | request parcel: ${parcel}`);
  // check that the request comes from a decentraland domain
  const validOrigin = TESTS_ENABLED || checkOrigin(req);
  if (!validOrigin) {
    throw new Error("INVALID ORIGIN");
  }

  // filter against a denylist of malicious ips
  const validIP = checkBannedIPs(req);
  if (validIP) {
    throw new Error("INVALID IP");
  }

  // Validate that the authchain signature is real
  // validate that the player is in the catalyst & location from the signature
  const validCatalystPos: boolean = (TESTS_ENABLED || metadata.realm.catalystName === "localhost:8000" || metadata.realm.catalystName === "127.0.0.1:8000") ? true : await checkPlayer(userAddress, base, coordinates);
  if (!validCatalystPos) {
    throw new Error("INVALID PLAYER POSITION");
  }

  // validate that the player is in a valid location for this operation - if a parcel is provided
  const validPos: boolean = TESTS_ENABLED || parcel?.length ? checkCoords(coordinates, parcel) : true;

  if (!validPos) {
    throw new Error("INVALID PARCEL POSITION");
  }
}

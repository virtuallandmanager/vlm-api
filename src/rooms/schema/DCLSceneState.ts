import { Schema, ArraySchema, type } from "@colyseus/schema";

class DCLUser extends Schema {
  @type("string") realm: string;
  @type("string") displayName: string;
  @type("string") connectedWallet: string;
}

class VLMUser extends Schema {
  @type("string") displayName: string;
  @type("string") connectedWallet: string;
}

export class DCLSceneState extends Schema {
  @type([DCLUser]) dclUsers: ArraySchema<DCLUser>;
  @type([VLMUser]) vlmUsers: ArraySchema<VLMUser>;

  constructor() {
    super();
  }
}

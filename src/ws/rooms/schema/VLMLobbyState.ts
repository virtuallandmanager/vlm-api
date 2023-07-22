import { Schema, ArraySchema, type } from "@colyseus/schema";

class InWorldUser extends Schema {
  @type("string") realm: string;
  @type("string") displayName: string;
  @type("string") connectedWallet: string;
  @type("string") sk: string;
}

export class VLMLobbyState extends Schema {
  @type([InWorldUser]) waiting: ArraySchema<InWorldUser>;

  constructor() {
    super();
  }
}

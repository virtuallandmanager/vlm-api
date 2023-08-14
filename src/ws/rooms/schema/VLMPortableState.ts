import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";

export class PortableExperience extends Schema {
  @type("string")
  sk: string;

  @type("string")
  itemId: string;

  @type(Schema) metadata: Schema = new ExperienceMetadata({});


}
export class ExperienceMetadata extends Schema {

}

export class VLMPortableState extends Schema {
  @type([PortableExperience])
  experiences = new ArraySchema<PortableExperience>();

  constructor() {
    super();
  }
}

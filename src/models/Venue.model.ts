import { v4 as uuidv4 } from "uuid";
import { Metaverse } from "./Metaverse.model";

export namespace Venue {
  export class Config {
    static pk: string = "vlm:venue"
    pk: string = Config.pk
    sk: string = uuidv4()
    locations: Array<Metaverse.Location> = []
    venueSize: VenueSize
  }

  export class Reservation {
    static pk: string = "vlm:venue:reservation";
    pk: string = Reservation.pk;
    sk: string = uuidv4();
    venueId: string;
    startTime: EpochTimeStamp;
    endTime: EpochTimeStamp;
    soundChecks: Array<string>;
    hosts: Array<string>;
    guestList: Array<string>;
    guestLimit: number;
  }

  export class SoundCheck {
    static pk: string = "vlm:venue:reservation:soundcheck";
    pk: string = Reservation.pk;
    sk: string = uuidv4();
    venueId: string;
    startTime: EpochTimeStamp;
    endTime: EpochTimeStamp;
    hosts: Array<string>;
    guestList: Array<string>;
    guestLimit: number;
  }

  export enum VenueSize {
    LOUNGE = "Lounge",
    CLUB = "Club",
    HALL = "Hall",
    ARENA = "Arena",
    STADIUM = "Stadium",
  }

}
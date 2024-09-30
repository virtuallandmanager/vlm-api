import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'

export namespace Stream {
  export class Config {
    static pk: string = 'vlm:video:stream'
    pk?: string = Config.pk
    sk?: string = uuidv4()
    name?: string = 'New Video Stream'
    watchUrl?: string
    streamUrl?: string
    streamKey?: string
    authKey?: string
    createdAt?: EpochTimeStamp = DateTime.now().toMillis()
    deleted?: boolean = false
    running?: boolean = false
    starting?: boolean = false
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config?: Config) {
      this.sk = config?.sk || this.sk
      this.name = config?.name || this.name
      this.watchUrl = config?.watchUrl || this.watchUrl
      this.streamUrl = config?.streamUrl || this.streamUrl
      this.streamKey = config?.streamKey || this.streamKey
      this.authKey = config?.authKey || this.authKey
      this.deleted = config?.deleted || this.deleted
      this.running = config?.running || this.running
      this.starting = config?.starting || this.starting
      this.ts = config?.ts || this.ts
    }
  }
}

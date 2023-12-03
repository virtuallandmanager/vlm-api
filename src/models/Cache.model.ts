import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

export namespace Cache {
  export class Config {
    static pk: string = 'vlm:redis:cache'
    pk?: string = Config.pk
    sk?: string = uuidv4()
    data?: { [key: string]: any } = {}
    ts?: EpochTimeStamp = DateTime.now().toUnixInteger()

    constructor(config: Config) {
      this.sk = config.sk || this.sk
      this.data = config.data || this.data
      this.ts = config.ts || this.ts
    }
  }
}

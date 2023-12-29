import { Redis, RedisKey, RedisValue } from 'ioredis'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

export namespace Cache {
  export class Config {
    static pk: string = 'vlm:redis:cache'
    pk?: string = Config.pk
    sk?: RedisKey = uuidv4()
    data?: RedisValue = JSON.stringify({})
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config: Config) {
      this.sk = config.sk || this.sk
      this.data = config.data || this.data
      this.ts = config.ts || this.ts
    }
  }
}

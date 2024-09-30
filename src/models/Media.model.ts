import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

export namespace Media {
  export class Channel {
    static pk: string = 'vlm:media:channel' // Partition Key
    pk?: string = Channel?.pk // Partition Key
    sk?: string = uuidv4() // Sort Key
    name?: string = 'Mystery Channel'
    description?: string
    createdAt?: number = DateTime.now().toMillis()
    imageSrc?: string
    websiteUrl?: string
    streamUrl?: string
    approvalState?: ChannelApprovalState = ChannelApprovalState.PENDING
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config: Channel) {
      this.sk = config.sk || this.sk
      this.name = config.name || this.name
      this.description = config.description || this.description
      this.createdAt = config.createdAt || this.createdAt
      this.imageSrc = config.imageSrc || this.imageSrc
      this.websiteUrl = config.websiteUrl || this.websiteUrl
      this.streamUrl = config.streamUrl || this.streamUrl
      this.ts = config.ts || this.ts
    }
  }

  export enum ChannelApprovalState {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
  }
}

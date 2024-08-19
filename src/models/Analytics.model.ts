import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { Session as BaseSession } from './Session.model'
import { Metaverse } from './Metaverse.model'

export namespace Analytics {
  export namespace Session {
    export class Config extends BaseSession.Config {
      static pk: string = 'vlm:analytics:session'
      pk: string = Config.pk
      device?: string
      paths?: string[] = []
      location?: Metaverse.Location
      environment?: string
      serverAuthenticated?: boolean = false
      peerAuthenticated?: boolean = false
      hasConnectedWeb3?: boolean = false
      sessionRole?: Role = Role.VISITOR
      ts?: EpochTimeStamp = DateTime.now().toMillis()
      ttl?: EpochTimeStamp

      constructor(config: Partial<Config> = {}) {
        super(config)
        this.device = config.device
        this.paths = config.paths || this.paths
        this.location = config.location
        this.environment = config.environment
        this.serverAuthenticated = config.serverAuthenticated
        this.peerAuthenticated = config.peerAuthenticated
        this.hasConnectedWeb3 = config.hasConnectedWeb3
        this.sessionRole = config.sessionRole
        this.ts = config.ts || this.ts
        this.ttl = config.ttl
      }
    }

    export class BotConfig extends BaseSession.Config {
      static pk: string = 'vlm:analytics:session'
      pk: string = Config.pk
      device?: string
      paths?: string[]
      location?: Metaverse.Location
      ttl?: EpochTimeStamp
      suspicious?: boolean = true

      constructor(config: Partial<Config>) {
        super(config)
        this.device = config.device
        this.location = config.location
        this.ttl = config.ttl
      }
    }

    export enum Role {
      VISITOR,
      SCENE_ADMIN,
      ORG_ADMIN,
      VLM_CONTRACTOR,
      VLM_EMPLOYEE,
      VLM_ADMIN,
    }

    export class Aggregate {
      static pk: string = 'vlm:analytics:aggregate' // Partition Key
      pk?: string = Aggregate.pk
      sk?: string = `${DateTime.now().minus({ days: 1 }).startOf('day').toISODate()}:${AggregateScale.MINUTE}` // Sort Key
      sceneId?: string
      startDateTime: EpochTimeStamp = DateTime.now().minus({ days: 1 }).startOf('day').toMillis()
      endDateTime: EpochTimeStamp = DateTime.now().minus({ days: 1 }).endOf('day').toMillis()
      actionCounts: ActionAggregate = {}
      actionNames: string[] = []
      scale?: AggregateScale = AggregateScale.MINUTE
      ts?: EpochTimeStamp = DateTime.now().toMillis()

      constructor(config: Aggregate) {
        this.sk = DateTime.fromMillis(config.startDateTime).toUTC().startOf('day').toISODate() + ':' + config.scale
        this.sceneId = config.sceneId
        this.startDateTime = config.startDateTime || this.startDateTime
        this.endDateTime = config.endDateTime || this.endDateTime
        this.actionCounts = config.actionCounts || this.actionCounts
        this.actionNames = config.actionNames || this.actionNames
        this.scale = config.scale || this.scale
        this.ts = config.ts || this.ts
      }
    }

    export class Action {
      static pk: string = 'vlm:analytics:session:action' // Partition Key
      pk?: string = Action.pk
      sk?: string = uuidv4() // Sort Key
      name?: string = 'Unknown Action'
      sessionId?: string
      sceneId?: string
      origin?: Metaverse.Location
      pathPoint?: PathPoint
      metadata?: any = {}
      ts?: EpochTimeStamp = DateTime.now().toMillis()

      constructor(config: Action) {
        this.sk = config.sk || this.sk
        this.name = config.name || this.name
        this.sessionId = config.sessionId
        this.sceneId = config.sceneId
        this.origin = config.origin
        this.pathPoint = config.pathPoint
        this.metadata = config.metadata || this.metadata
        this.ts = config.ts || this.ts
      }
    }
  }

  export class Path {
    static pk: string = 'vlm:analytics:path' // Partition Key
    pk?: string = Path.pk
    sk?: string = uuidv4() // Sort Key
    segments?: string[] = []
    ts?: EpochTimeStamp = DateTime.now().toMillis()

    constructor(config?: Path) {
      this.sk = config?.sk || this.sk
      this.segments = config?.segments || this.segments
      this.ts = config?.ts || this.ts
    }
  }

  export class PathSegment {
    static pk: string = 'vlm:analytics:path:segment' // Partition Key
    pk?: string = PathSegment.pk
    sk?: string = uuidv4() // Sort Key
    pathId?: string
    type?: SegmentType
    path?: PathPoint[] = []

    constructor(config: PathSegment) {
      this.sk = config.sk || this.sk
      this.pathId = config.pathId
      this.type = config.type
      this.path = config.path
    }
  }

  export enum SegmentType {
    LOADING,
    IDLE,
    STATIONARY_DISENGAGED,
    STATIONARY_ENGAGED,
    RUNNING_DISENGAGED,
    WALKING_DISENGAGED,
    RUNNING_ENGAGED,
    WALKING_ENGAGED,
  }

  export type ActionAggregate = {
    [isoDateTime: string]: { [count: string]: number }
  }

  export enum AggregateScale {
    MINUTE = 'minute',
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
  }

  export const PathPointLegend: Record<number, string> = {
    0: 'X-Position',
    1: 'Y-Position',
    2: 'Z-Position',
    3: 'Timestamp',
    4: 'X-Rotation',
    5: 'Y-Rotation',
    6: 'POV',
  }

  export type PathPoint = [
    number | null, //0
    number | null, //1
    number | null, //2
    number | null, //3
    number | null, //4
    number | null, //5
    -1 | 0 | 1 | 2, //6
    number | null, //7
    number | null, //8
    number | null, //9
    number | null //10
  ]

  // Action Locations and Path Points are arrays of primitives for data efficiency.

  ///////////////////////////////////////////////////////////////////////////////////

  // Action Point: [W, B]

  ////////////////////// LEGEND //////////////////////
  // W [0] = metaverse world
  // B [1] = player's segmented position in world, if relevant, such as a DCL parcel

  ///////////////////////////////////////////////////////////////////////////////////

  // Path Point: [O, Px, Py, Pz, Rx, Ry, V, Cx, Cy, CRx, CRy]

  ////////////////////// LEGEND //////////////////////
  // O [0] = offset from startTime - tracked in seconds
  // P [1,2,3] = player's relative position in scene
  // R [4,5] = camera rotation
  // V [6] = pov
  // C [7,8] = camera position
  // CR [9,10] = camera rotation
}

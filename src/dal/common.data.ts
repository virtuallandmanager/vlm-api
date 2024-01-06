import { Alchemy, Network } from 'alchemy-sdk'
import AWS, { DynamoDB } from 'aws-sdk'
import DAX from 'amazon-dax-client'
import config from '../../config/config'
import Redis, { RedisKey } from 'ioredis'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

export let docClient: AWS.DynamoDB.DocumentClient
export let daxClient: AWS.DynamoDB.DocumentClient
export let alchemyEth: Alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_API_KEY_MAINNET, network: Network.ETH_MAINNET })
export let alchemyPoly: Alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_API_KEY_MATIC, network: Network.MATIC_MAINNET })

// Create a new Redis client with the remote server IP
export const redis = new Redis({
  host: process.env.PRESENCE_SERVER_HOST,
  port: Number(process.env.PRESENCE_SERVER_PORT),
})

if (process.env.NODE_ENV !== 'development') {
  try {
    // For non-development environments, the environment already has the necessary permissions from the EC2 IAM role.
    // So just create the AWS service clients.
    AWS.config.update({
      region: process.env.AWS_REGION,
    })

    const dax = new DAX(config.aws_dax_config)
    var daxdb = new AWS.DynamoDB({
      ...config.aws_dax_config.endpoints,
      service: dax,
    } as DynamoDB.ClientConfiguration)

    let dynamodb = new AWS.DynamoDB(config.aws_config)

    docClient = new AWS.DynamoDB.DocumentClient({
      service: dynamodb,
    })

    daxClient = new AWS.DynamoDB.DocumentClient({
      service: daxdb,
    })
  } catch (error) {
    console.log('Error creating AWS service clients:', error)
  }
} else {
  // Load environment variables from developer's .env file
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  })

  // Create AWS service clients
  docClient = new AWS.DynamoDB.DocumentClient()
  daxClient = docClient
}

export let s3 = new AWS.S3({ region: process.env.AWS_REGION })
export const vlmMainTable = process.env.NODE_ENV == 'production' ? 'vlm_main' : `vlm_main${process.env.DEV_TABLE_EXT}`
export const vlmAnalyticsTable = process.env.NODE_ENV == 'production' ? 'vlm_analytics' : `vlm_analytics${process.env.DEV_TABLE_EXT}`
export const vlmClaimsTable = process.env.NODE_ENV == 'production' ? 'vlm_claims' : `vlm_claims${process.env.DEV_TABLE_EXT}`
export const vlmTransactionsTable = process.env.NODE_ENV == 'production' ? 'vlm_transactions' : `vlm_transactions${process.env.DEV_TABLE_EXT}`
export const vlmLogTable = process.env.NODE_ENV == 'production' ? 'vlm_logs' : `vlm_logs${process.env.DEV_TABLE_EXT}`
export const vlmUpdatesTable = process.env.NODE_ENV == 'production' ? 'vlm_updates' : `vlm_updates${process.env.DEV_TABLE_EXT}`
export const vlmUsersTable = process.env.NODE_ENV == 'production' ? 'vlm_users' : `vlm_users${process.env.DEV_TABLE_EXT}`
export const vlmSessionsTable = process.env.NODE_ENV == 'production' ? 'vlm_sessions' : `vlm_sessions${process.env.DEV_TABLE_EXT}`

export const largeQuery: CallableFunction = async (
  params: DocumentClient.QueryInput,
  options: { cache: boolean } = { cache: false },
  allData?: DocumentClient.AttributeMap[]
) => {
  if (!allData) {
    allData = []
  }

  if (options.cache) {
    var data = await daxClient.query(params).promise()
  } else {
    var data = await docClient.query(params).promise()
  }

  if (data['Items'].length > 0) {
    allData = [...allData, ...data['Items']]
  }

  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey
    return await largeQuery(params, options, allData)
  } else {
    let finalData = allData
    return finalData
  }
}

export const largeScan: CallableFunction = async (
  params: DocumentClient.QueryInput,
  chunkCb?: CallableFunction,
  allData?: DocumentClient.AttributeMap[]
) => {
  if (!allData) {
    allData = []
  }

  let data = await docClient.scan(params).promise()
  if (data['Items'].length > 0) {
    allData = [...allData, ...data['Items']]
    await chunkCb(data['Items'])
  }
  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey
    return await largeScan(params, chunkCb, allData)
  } else {
    let finalData = allData
    return finalData
  }
}
export const batchQuery: CallableFunction = async (params: AWS.DynamoDB.QueryInput, allData: any[]) => {
  if (!allData) {
    allData = []
  }

  let data = await docClient.query(params).promise()

  if (data['Items'].length > 0) {
    allData = [...allData, ...data['Items']]
  }

  if (!params.Limit && data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey
    return await batchQuery(params, allData)
  } else {
    let finalData = allData
    return finalData
  }
}

export interface IDbItem {
  pk?: string
  sk?: string | RedisKey
  [key: string]: any
}

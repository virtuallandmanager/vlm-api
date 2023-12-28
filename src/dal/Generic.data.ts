import { IDbItem, daxClient, docClient, largeQuery, vlmMainTable } from './common.data'
import { AdminLogManager } from '../logic/ErrorLogging.logic'
import { DateTime } from 'luxon'

export abstract class GenericDbManager {
  static obtain: CallableFunction = async (dataConfig: IDbItem) => {
    let existingData, updatedData, finalData
    try {
      existingData = await this.get(dataConfig)
      updatedData = Object.assign({}, existingData, dataConfig)
      finalData = await this.put(updatedData)

      return finalData
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Generic.data/obtain',
        dataConfig,
      })
      return
    }
  }

  static get = async (dataConfig: IDbItem) => {
    const { pk, sk } = dataConfig

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
    }

    try {
      const record = await docClient.get(params).promise()
      return record.Item
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Generic.data/get',
        dataConfig,
      })
      return
    }
  }

  static getAll = async (dataConfig: IDbItem) => {
    const { pk, sk } = dataConfig

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
      },
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': pk,
      },
    }

    try {
      const records = await largeQuery(params)
      return records || []
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Generic.data/query',
        dataConfig,
      })
      return []
    }
  }

  static getFragment = async (dataConfig: IDbItem, props: string[]) => {
    const { pk, sk } = dataConfig
    let ProjectionExpression,
      ExpressionAttributeNames: { [any: string]: string } = {}

    props.forEach((prop: string) => {
      ExpressionAttributeNames[`#${prop}`] = prop
    })
    ProjectionExpression = Object.keys(ExpressionAttributeNames).join(', ')

    const params = {
      TableName: vlmMainTable,
      Key: {
        pk,
        sk,
      },
      ProjectionExpression,
      ExpressionAttributeNames,
    }

    try {
      const record = await docClient.get(params).promise()
      return record.Item
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Generic.data/getFragment',
        dataConfig,
      })
      return
    }
  }

  static getAllForUser = async (pk: string, userId: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: 'userId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':pk': pk,
        ':userId': userId,
      },
      KeyConditionExpression: '#pk = :pk and #userId = :userId',
    }

    try {
      const records = await largeQuery(params)
      return records
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Generic.data/get',
        pk,
        userId,
      })
      return
    }
  }

  static getAllForOrg = async (pk: string, orgId: string) => {
    const params = {
      TableName: vlmMainTable,
      IndexName: 'orgId-index',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':pk': pk,
        ':orgId': orgId,
      },
      KeyConditionExpression: '#pk = :pk and #orgId = :orgId',
    }

    try {
      const records = await largeQuery(params)
      return records
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Generic.data/get',
        pk,
        orgId,
      })
      return
    }
  }

  static put = async (dataConfig: IDbItem, useCaching: boolean = false) => {
    const params = {
      TableName: vlmMainTable,
      Item: {
        ...dataConfig,
        ts: DateTime.now().toUnixInteger(),
      },
    }

    try {
      if (useCaching) {
        await daxClient.put(params).promise()
      } else {
        await docClient.put(params).promise()
      }
      const dbItem = await this.get(dataConfig)
      return dbItem
    } catch (error) {
      AdminLogManager.logError(error, {
        from: 'Generic.data/put',
        dataConfig,
      })
      return
    }
  }
}

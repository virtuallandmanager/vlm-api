import axios from 'axios'
import { Giveaway } from '../models/Giveaway.model'

export const getDclCollection = async (contractAddress: string) => {
  try {
    const response = await axios.get(`https://nft-api.decentraland.org/v1/collections?sortBy=newest&contractAddress=${contractAddress}`)
    const ip = response?.data?.data
    return ip
  } catch (error) {
    return { error }
  }
}

export const getDclCollectionsForUser = async (walletAddress: string) => {
  try {
    const response = await axios.get(`https://nft-api.decentraland.org/v1/collections?sortBy=newest&creator=${walletAddress}`)
    const ip = response?.data?.data
    return ip
  } catch (error) {
    return { error }
  }
}

export const getDclCollectionItems = async (contractAddress: string) => {
  try {
    const response = await axios.get(`https://nft-api.decentraland.org/v1/items?contractAddress=${contractAddress}`)
    const items = response?.data?.data

    if (!items) {
      return []
    }

    if (response?.data?.total === items?.length) {
      return items
    }

    const itemIds = response.data.data.map((item: any) => Number(item.itemId))
    const set = new Set(itemIds)
    const missingNumbers: number[] = []

    for (let i = 0; i < response.data.total; i++) {
      if (!set.has(i)) {
        missingNumbers.push(i)
      }
    }

    if (missingNumbers.length < 0) {
      return items
    }

    for (let itemId of missingNumbers) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (itemId === undefined) {
        continue
      }
      try {
        const response = await axios.get(`https://nft-api.decentraland.org/v1/items?contractAddress=${contractAddress}&itemId=${itemId}`)
        if (response?.data?.data && response?.data?.data.length > 0) {
          items.push(...response?.data?.data)
        }
      } catch (error) {
        console.log('Error fetching missing item', itemId, error)
      }
    }

    return items.length ? sortByItemId(items) : []
  } catch (error) {
    return error
  }
}

function sortByItemId(arr: Giveaway.Item[]): Giveaway.Item[] {
  return arr.sort((a, b) => {
    // Convert both itemId to numbers and compare
    return Number(a.itemId) - Number(b.itemId)
  })
}

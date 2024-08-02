import axios from 'axios'

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
    if (response.data.total > items.length) {
      for (let i = items.length; i < response.data.total; i++) {
        const response = await axios.get(`https://nft-api.decentraland.org/v1/items?contractAddress=${contractAddress}&itemId=${i}`)
        items.push(...response?.data?.data)
      }
    }
    return items
  } catch (error) {
    return { error }
  }
}

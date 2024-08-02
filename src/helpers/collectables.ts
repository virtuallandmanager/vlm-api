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
    const ip = response?.data?.data
    return ip
  } catch (error) {
    return { error }
  }
}

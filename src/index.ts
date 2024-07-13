import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import { ethers } from "ethers"
import { Web3 } from 'web3'

import type { FrameSignaturePacket } from './types'
import BAYC_ABI from '../contracts/bayc_abi.json'

const app = new Hono()

const endpoint = 'https://api.subquery.network/sq/OxHimanshu/frame-subql' // Replace with your actual URL
const DEFAULT_IMAGE = 'https://imageplaceholder.net/600x400/7b68ee/ffffff?text='
const CONTRACT_ADDRESS = '0xe6BBD0c6E14AEbe890367619098898Ed1c17f16E'
const BASE_URL=process.env.BASE_URL

function returnHome(imageLink: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${imageLink}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageLink}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="View NFTs" />
        <meta
          property="fc:frame:button:1:post_url"
          content="${BASE_URL}/tx_callback"
        />
        <meta property="fc:frame:button:2" content="Mint" />
        <meta name="fc:frame:button:2:action" content="tx" />
        <meta
          property="fc:frame:button:2:target"
          content="${BASE_URL}/get_tx_data"
        />
        <meta
          property="fc:frame:button:2:post_url"
          content="${BASE_URL}/tx_callback"
        />
        <title>Farcaster Frames</title>
      </head>
      <body>
        <h1>Hello Farcaster!</h1>
        <p className="mb-10">Refresh browser to refresh image</p>
      </body>
    </html>
  `
}

function errorPage(imageLink: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${imageLink}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageLink}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="Back" />
        <title>Farcaster Frames</title>
      </head>
      <body>
        <h1>Hello Farcaster!</h1>
        <p className="mb-10">Refresh browser to refresh image</p>
      </body>
    </html>
  `
}

function returnSuccess(imageLink: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${imageLink}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageLink}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:input:text" content="Enter wallet address" />
        <meta property="fc:frame:button:1" content="Back" />
        <meta property="fc:frame:button:2" content="Show All NFTs" />
        <meta name="fc:frame:post_url" content="${BASE_URL}/list_nfts" />
        <title>Farcaster Frames</title>
      </head>
      <body>
        <h1>Hello Farcaster!</h1>
        <p className="mb-10">Refresh browser to refresh image</p>
      </body>
    </html>
  `
}

function listNFTs(ipfs: string, counter: number, user: string) {
  return html`
  <html lang="en">
    <head>
      <meta property="og:image" content="${ipfs}" />
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${ipfs}" />
      <meta property="fc:frame:image:aspect_ratio" content="1:1" />
      <meta property="fc:frame:button:1" content="Back" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta name="fc:frame:post_url" content="${BASE_URL}/nfts?counter=${counter}&user=${user}">
      <title>Farcaster Frames</title>
    </head>
    <body>
      <h1>Hello Farcaster!</h1>
      <p className="mb-10">Refresh browser to refresh image</p>
    </body>
  </html>
`
}

async function fetchGraphQL(query: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  const data = await response.json()
  return data
}

async function fetchImageIPFS(url: string) {
  const response = await fetch("https://ipfs.io/ipfs/" + url.substring(7), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  const data = await response.json()
  return data["image"]
}

app.get('/', async (c) => {
  const frameImage = `${DEFAULT_IMAGE}Click below to mint a NFT`
  return c.html(returnHome(frameImage))
})

app.post('/', async (c) => {
  const frameImage = `${DEFAULT_IMAGE}Click below to mint a NFT`
  return c.html(returnHome(frameImage))
})

app.post('/get_tx_data', async (c) => {
  const contractAbi = BAYC_ABI; // your contract's ABI
  const methodName = 'safeMint'; // the method you want to call
  const methodArgs = []; // the arguments for the method
  const selector = ethers.FunctionFragment.getSelector(methodName);

  let web3 = new Web3(Web3.givenProvider || 'https://base-sepolia.blockpi.network/v1/rpc/public	')
  const encodedData = web3.eth.abi.encodeFunctionSignature('safeMint()')

  // const encodedData = ethers.utils.abi.encodeWithSelector(contractAbi, selector, methodArgs);
  
  c.status(200)
  return c.json({
    method: "eth_sendTransaction",
    chainId: "eip155:84532",
    params: {
      abi: contractAbi, // JSON ABI of the function selector and any errors
      to: CONTRACT_ADDRESS,
      data: encodedData
    },
  })
})

app.post('/tx_callback', async (c) => {
  const body = await c.req.json<FrameSignaturePacket>()
  const buttonIndex = body.untrustedData.buttonIndex
  if(buttonIndex == 1) {
    const frameImage = `${DEFAULT_IMAGE}View All`
    return c.html(returnSuccess(frameImage))
  }
  const frameImage = `${DEFAULT_IMAGE}NFT minted success`
  return c.html(returnSuccess(frameImage))
})

app.post('/list_nfts', async (c) => {
  const body = await c.req.json<FrameSignaturePacket>()
  const { inputText } = body.untrustedData
  const buttonIndex = body.untrustedData.buttonIndex
  if(buttonIndex == 1) { 
    const frameImage = `${DEFAULT_IMAGE}Click below to mint a NFT`
    return c.html(returnHome(frameImage))
  } else {
    try {
      const query = `query {
        minters(filter: {user: {equalTo: "${inputText}"}}) {
          edges {
            node {
              id
              user
              tokenURI
            }
          }
        }
      }`
  
      const data = await fetchGraphQL(query)
      const nodes = data.data.minters.edges
  
      if (nodes.length == 0) {
        const frameImage = `${DEFAULT_IMAGE}No Nfts Found`
        return c.html(errorPage(frameImage))
      }
      const ipfs = await fetchImageIPFS(nodes[0].node.tokenURI)
  
      return c.html(listNFTs(`https://ipfs.io/ipfs/${ipfs.substring(7)}`, 0, inputText))
    } catch (error) {
      console.error('Fetch error:', error)
      const frameImage = `${DEFAULT_IMAGE}Failed to mint NFT`
      return c.html(errorPage(frameImage))
    }
  }
})

app.post('/nfts', async (c) => {
  const body = await c.req.json<FrameSignaturePacket>()
  const buttonIndex = body.untrustedData.buttonIndex

  let counter = Number(c.req.query('counter')) + 1
  let user = c.req.query('user')

  if(user == undefined) {
    user = ""
  }

  if(buttonIndex == 1) { 
    const frameImage = `${DEFAULT_IMAGE}Click below to mint a NFT`
    return c.html(returnHome(frameImage))
  } else {
    try {
      const query = `query {
        minters(filter: {user: {equalTo: "${user}"}}) {
          edges {
            node {
              id
              user
              tokenURI
            }
          }
        }
      }`
  
      const data = await fetchGraphQL(query)
      const nodes = data.data.minters.edges
  
      if (nodes.length == 0) {
        const frameImage = `${DEFAULT_IMAGE}No Nfts Found`
        return c.html(errorPage(frameImage))
      } else if (counter >= nodes.length) {
        counter = 0
      }
  
      const ipfs = await fetchImageIPFS(nodes[counter].node.tokenURI)
  
      return c.html(listNFTs(`https://ipfs.io/ipfs/${ipfs.substring(7)}`, counter, user))
    } catch (error) {
      console.error('Fetch error:', error)
      const frameImage = `${DEFAULT_IMAGE}No Nfts Found`
      return c.html(errorPage(frameImage))
    }
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})

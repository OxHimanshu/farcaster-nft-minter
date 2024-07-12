import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import type { FrameSignaturePacket } from './types'

const app = new Hono()

const endpoint = 'https://api.subquery.network/sq/OxHimanshu/frame-subql' // Replace with your actual URL
const DEFAULT_IMAGE = 'https://imageplaceholder.net/600x400/7b68ee/ffffff?text='
const CONTRACT_ADDRESS = '0xe6BBD0c6E14AEbe890367619098898Ed1c17f16E'
const BASE_URL=''

function returnHome(imageLink: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${imageLink}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageLink}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="Mint" />
        <meta name="fc:frame:button:1:action" content="mint" />
        <meta
          name="fc:frame:button:1:target"
          content="eip155:84532:${CONTRACT_ADDRESS}"
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

function showNFT(ipfs: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${ipfs}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ipfs}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="Show All" />
        <title>Farcaster Frames</title>
      </head>
      <body>
        <h1>Hello Farcaster!</h1>
        <p className="mb-10">Refresh browser to refresh image</p>
      </body>
    </html>
  `
}

function listNFTs(ipfs: string, counter: BigInteger) {
  return html`
  <html lang="en">
    <head>
      <meta property="og:image" content="${ipfs}" />
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${ipfs}" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      <meta property="fc:frame:button:1" content="Back" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta name="fc:frame:post_url" content="${BASE_URL}/nfts?counter=${counter}">
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
  const response = await fetch(url, {
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
  console.log(process.env.API_URL)
  const frameImage = `${DEFAULT_IMAGE}Click below to mint a NFT`
  return c.html(returnHome(frameImage))
})

app.post('/', async (c) => {
  try {
    const body = await c.req.json<FrameSignaturePacket>()
    const { inputText } = body.untrustedData
    const query = `query {
      minters(filter: {user: {equalTo: "${body.untrustedData.address}"}} last: 1) {
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
    const node = data.data.minters.edges

    if (!node) {
      const frameImage = `${DEFAULT_IMAGE}Failed to mint NFT`
      return c.html(showNFT(frameImage))
    }

    const ipfs = await fetchImageIPFS(node.id["tokenURI"])

    return c.html(showNFT(ipfs))
  } catch (error) {
    console.error('Fetch error:', error)
    const frameImage = `${DEFAULT_IMAGE}Failed to mint NFT`
    return c.html(showNFT(frameImage))
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})

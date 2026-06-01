/**
 * MongoDB connection singleton.
 *
 * Reuses one MongoClient across all API route invocations in the same
 * Node.js process. In development, the client is cached on the global
 * object so Hot-Module Replacement doesn't open new connections on
 * every file save.
 */

import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error(
    'MONGODB_URI is not defined. Add it to .env.local:\n' +
    'MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/DBbuilder'
  )
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Keep alive for serverless – avoids cold-start latency on every request
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // Cache across HMR reloads
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = new MongoClient(uri, options).connect()
}

export default clientPromise

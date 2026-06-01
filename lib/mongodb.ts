/**
 * MongoDB connection singleton (lazy).
 *
 * Does not connect or throw at import time so `next build` succeeds on Vercel
 * before MONGODB_URI is read at runtime. Connection is created on first use.
 */

import { MongoClient, ServerApiVersion } from 'mongodb'

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
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
}

function missingUriError(): Error {
  return new Error(
    'MONGODB_URI is not defined. Set it in Vercel → Project → Settings → Environment Variables, ' +
      'or in .env.local:\nMONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/DBbuilder'
  )
}

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    return Promise.reject(missingUriError())
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect()
    }
    return global._mongoClientPromise
  }

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect()
  }
  return global._mongoClientPromise
}

/** @deprecated Prefer getMongoClient(); kept for existing imports. */
const lazyClientPromise: Promise<MongoClient> = {
  then(onFulfilled, onRejected) {
    return getMongoClient().then(onFulfilled, onRejected)
  },
  catch(onRejected) {
    return getMongoClient().catch(onRejected)
  },
  finally(onFinally) {
    return getMongoClient().finally(onFinally)
  },
} as Promise<MongoClient>

export default lazyClientPromise

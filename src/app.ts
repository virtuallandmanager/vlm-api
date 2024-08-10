import express from 'express'
import bodyParser from 'body-parser'
import requestIp from 'request-ip'
import rateLimit from 'express-rate-limit';
import cors, { CorsOptions } from 'cors'
import { monitor } from '@colyseus/monitor'
import basicAuth from 'express-basic-auth'
import healthCheck from './healthCheck'
import userController from './http/controllers/User.controller'
import authController from './http/controllers/Authentication.controller'
import adminController from './http/controllers/Admin.controller'
import sceneController from './http/controllers/Scene.controller'
import sessionController from './http/controllers/Session.controller'
import eventController from './http/controllers/Event.controller'
import mediaController from './http/controllers/Media.controller'
import logController from './http/controllers/Log.controller'
import giveawayController from './http/controllers/Giveaway.controller'
import balanceController from './http/controllers/Balance.controller'
import promotionController from './http/controllers/Promotion.controller'
import analyticsController from './http/controllers/Analytics.controller'
import collectionController from './http/controllers/Collection.controller'
import transactionController from './http/controllers/Transaction.controller'

// Create Express server
const app = express()

// Express configuration
app.set('port', process.env.PORT || 3010)

app.use(requestIp.mw())

app.use((req, res, next) => {
  const clientIp = requestIp.getClientIp(req)
  next()
})

const jsonParser = bodyParser.json({ limit: '50mb' })
const urlencodedParser = bodyParser.urlencoded({ limit: '50mb', extended: true })

const adminAuth = (username: string, password: string) => {
  const userMatches = basicAuth.safeCompare(username, process.env.ADMIN_USERNAME)
  const passwordMatches = basicAuth.safeCompare(password, process.env.ADMIN_PASSWORD)

  return userMatches && passwordMatches
}

const corsOptions: CorsOptions = {
  origin: [
    /^https:\/\/([a-z0-9]+\.)?decentraland\.org(\/play)?\/?$/,
    /^https:\/\/([a-z0-9]+\.)?vlm\.gg\/?$/,
    /^http:\/\/localhost:\d+\/?$/,
    /^https:\/\/localhost:\d+\/?$/,
    /^http:\/\/\d+.\d+.\d+.\d+:\d+\/?$/,
  ],
  allowedHeaders: [
    'Content-Type, Authorization, x-identity-timestamp, x-identity-metadata, x-identity-auth-chain-0, x-identity-auth-chain-1, x-identity-auth-chain-2',
    'x-alchemy-signature',
  ],
  credentials: true,
}

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply the rate limiter to all requests
app.use(limiter);

app.use(cors(corsOptions))

app.use('/_health', healthCheck)
app.use('/auth', jsonParser, urlencodedParser, authController)
app.use('/admin', jsonParser, urlencodedParser, adminController)
app.use('/analytics', jsonParser, urlencodedParser, analyticsController)
app.use('/balance', jsonParser, urlencodedParser, balanceController)
app.use('/collection', jsonParser, urlencodedParser, collectionController)
app.use('/event', jsonParser, urlencodedParser, eventController)
app.use('/giveaway', jsonParser, urlencodedParser, giveawayController)
app.use('/media', mediaController) // No body-parser middleware applied to this route
app.use('/promotion', jsonParser, urlencodedParser, promotionController)
app.use('/scene', jsonParser, urlencodedParser, sceneController)
app.use('/session', jsonParser, urlencodedParser, sessionController)
app.use('/transaction', jsonParser, urlencodedParser, transactionController)
app.use('/user', jsonParser, urlencodedParser, userController)
app.use(
  '/_status',
  basicAuth({
    authorizer: adminAuth,
    challenge: true, // This will cause browsers to show a login dialog
    unauthorizedResponse: (req: Request) => 'Access Denied',
  }),
  monitor({
    columns: [{ metadata: 'name' }, { metadata: 'sceneId' }, { metadata: 'worlds' }, { metadata: 'locations' }, 'clients', 'elapsedTime'],
  })
)
app.use('/log', jsonParser, urlencodedParser, logController)

export default app

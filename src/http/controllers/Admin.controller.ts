import express, { Request, Response } from 'express'
import { Event } from '../../models/Event.model'
import { OrganizationManager } from '../../logic/Organization.logic'
import { authMiddleware, vlmAdminMiddleware } from '../../middlewares/security/auth'
import { AdminManager } from '../../logic/Admin.logic'
import { AdminLogManager } from '../../logic/ErrorLogging.logic'
import { MigrationDbManager } from '../../dal/Migration.data'
import { SessionManager } from '../../logic/Session.logic'

const router = express.Router()

router.get('/panel', authMiddleware, vlmAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminPanelKeys = await AdminManager.getAdminPanelKeys()

    return res.status(200).json({
      text: `Got admin panel keys. Use wisely!`,
      ...adminPanelKeys,
    })
  } catch (error: any) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Admin.controller/users',
    })
    return res.status(error?.status || 500).json({
      text: error.text || 'Something went wrong on the server. Please try again.',
      error,
    })
  }
})

router.get('/server/restrictions', authMiddleware, vlmAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const serverRestrictions = await SessionManager.getServerRestrictions()
    return res.status(200).json({
      text: `Got server restrictions.`,
      serverRestrictions,
    })
  } catch (error: any) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Admin.controller/users',
    })
    return res.status(error?.status || 500).json({
      text: error.text || 'Something went wrong on the server. Please try again.',
      error,
    })
  }
})

router.get('/logs', authMiddleware, vlmAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = req.query.page,
      pageSize = req.body.pageSize,
      sort = req.body.sort

    const adminLogs = await AdminManager.getAdminLogs(page, pageSize, sort)

    return res.status(200).json({
      text: `Loaded admin logs.`,
      adminLogs,
    })
  } catch (error: any) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Admin.controller/logs',
    })
    return res.status(error?.status || 500).json({
      text: error.text || 'Something went wrong on the server. Please try again.',
      error,
    })
  }
})

router.get('/users', authMiddleware, vlmAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = req.query.page,
      pageSize = req.body.pageSize,
      sort = req.body.sort

    const users = await AdminManager.getUsers(page, pageSize, sort)

    return res.status(200).json({
      text: `Found ${users?.length || 0} users.`,
      users,
    })
  } catch (error: any) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Admin.controller/users',
    })
    return res.status(error?.status || 500).json({
      text: error.text || 'Something went wrong on the server. Please try again.',
      error,
    })
  }
})

router.get('/events', authMiddleware, vlmAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const page = req.query.page,
      pageSize = req.body.pageSize,
      sort = req.body.sort

    const events = await AdminManager.getEvents(page, pageSize, sort)
    events.sort((a: Event.Config, b: Event.Config) => {
      if (a.eventStart < b.eventStart) {
        return -1
      }
      if (a.eventStart > b.eventStart) {
        return 1
      }
      return 0
    })

    return res.status(200).json({
      text: `Found ${events?.length || 0} events.`,
      events,
    })
  } catch (error: any) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Admin.controller/users',
    })
    return res.status(error?.status || 500).json({
      text: error.text || 'Something went wrong on the server. Please try again.',
      error,
    })
  }
})

router.post('/update', authMiddleware, vlmAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const userOrgInfo = req.body.userOrgInfo

    const organization = await OrganizationManager.update(userOrgInfo)

    return res.status(200).json({
      text: 'Successfully updated organization.',
      organization,
    })
  } catch (error: any) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Admin.controller/update',
    })
    return res.status(error?.status || 500).json({
      text: error.text || 'Something went wrong on the server. Please try again.',
      error,
    })
  }
})

router.get('/migrate/:pk', async (req: Request, res: Response) => {
  try {
    const { pk } = req.params
    await MigrationDbManager.moveDataInBatches(pk, 'vlm_main', 'vlm_sessions', 25)
    return res.status(200).json({
      text: 'Successfully migrated data.',
    })
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Session.controller/migrate',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

router.get('stats', async (req: Request, res: Response) => {
  try {
    const status = await SessionManager.getSessionStats()
    return res.status(200).json({
      text: 'Successfully got status.',
      status: JSON.stringify(status),
    })
  } catch (error: unknown) {
    AdminLogManager.logError(JSON.stringify(error), {
      from: 'Admin.controller/getStatus',
    })
    return res.status(500).json({
      text: JSON.stringify(error) || 'Something went wrong on the server. Try again.',
      error,
    })
  }
})

export default router

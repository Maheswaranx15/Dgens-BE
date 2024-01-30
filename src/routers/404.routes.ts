import express, { Router } from 'express';
import { errorJson, errorHtml } from '../middleware/errors'

const router: Router = express.Router()

router.get('/api*', async (req, res) => { errorJson(res, 404) })
router.get('*', async (req, res) => { errorHtml(res, 404) })

router.post('/api*', async (req, res) => { errorJson(res, 404) })
router.post('*', async (req, res) => { errorHtml(res, 404) })

router.patch('/api*', async (req, res) => { errorJson(res, 404) })
router.patch('*', async (req, res) => { errorHtml(res, 404) })

router.put('/api*', async (req, res) => { errorJson(res, 404) })
router.put('*', async (req, res) => { errorHtml(res, 404) })

router.delete('/api*', async (req, res) => { errorJson(res, 404) })
router.delete('*', async (req, res) => { errorHtml(res, 404) })

export default router
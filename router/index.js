const Router = require('express').Router
const router = new Router()
const UserController = require('../controllers/user-controller.js')
const { body } = require('express-validator')
const authMiddleware = require('../middlewares/auth-middleware.js') //Для проверки пользователя на авторизованность.

router.post(
  '/registration',
  body('phone').isMobilePhone(),
  body('password').isLength({ min: 6, max: 32 }),
  UserController.registration
)
router.post('/login', UserController.login)
router.post('/logout', UserController.logout)
router.get('/refresh', UserController.refresh)
router.get('/activate/:smsCode', UserController.activate)
router.get('/users', authMiddleware, UserController.getUsers)
router.post(
  '/updateBalance',
  authMiddleware,
  body('newBalance').isInt({ min: -1, max: 99999 }),
  UserController.updateBalance
)
router.post(
  '/updateTariff',
  authMiddleware,
  body('newTariff').isLength({ min: 3, max: 15 }),
  UserController.updateTariff
)

module.exports = router

const UserService = require('../service/user-service.js')
const { validationResult } = require('express-validator')
const ApiError = require('../exceptions/api-error.js')
//Повторяющиеся фрагменты кода можно вынести в отдельные функции. Ну можно и можно...
class UserController {
  async registration(req, res, next) {
    try {
      const errors = validationResult(req) //Настроить валидацию в других местах, где надо
      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest('Validation error...', errors.array()))
      }
      const { phone, password } = req.body
      const userData = await UserService.registration(phone, password)
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      }) //!!! Добавить secure: true при использовании https!
      return res.json(userData)
    } catch (error) {
      next(error)
    }
  }
  async login(req, res, next) {
    try {
      const { phone, password } = req.body
      const userData = await UserService.login(phone, password)
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      }) //!!! Добавить secure: true при использовании https!
      return res.json(userData)
    } catch (error) {
      next(error)
    }
  }
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const token = await UserService.logout(refreshToken)
      res.clearCookie('refreshToken')
      return res.json(token)
    } catch (error) {
      next(error)
    }
  }
  async activate(req, res, next) {
    try {
      const smsCode = req.params.smsCode
      const userData = await UserService.activate(smsCode)
      return res.json(userData)
    } catch (error) {
      next(error)
    }
  }
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      const userData = await UserService.refresh(refreshToken)
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      }) //!!! Добавить secure: true при использовании https!
      return res.json(userData)
    } catch (error) {
      next(error)
    }
  }
  async getUsers(req, res, next) {
    try {
      res.json(['Dokkappalka', 'Pipa'])
    } catch (error) {}
  }
  async updateBalance(req, res, next) {
    //Разобраться с тем, как сделать это безопаснее
    try {
      const errors = validationResult(req) //Настроить валидацию в других местах, где надо
      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest('Validation error...', errors.array()))
      }
      const { refreshToken } = req.cookies
      const { newBalance } = req.body
      const userData = await UserService.updateBalance(refreshToken, newBalance)
      return res.json(userData)
    } catch (error) {
      next(error)
    }
  }
  async updateTariff(req, res, next) {
    //Сделать изменение баланса не отдельно на фронте, а прямо тута... Разрешить только текущие тарифы, вот...
    try {
      const { refreshToken } = req.cookies
      const { newTariff } = req.body
      const { ip } = req
      let newBalance
      console.log(ip)
      if (newTariff === 'Standart') {
        newBalance = [100]
      } else if (newTariff === 'VIP') {
        newBalance = [200]
      } else if (newTariff === 'Premium') {
        newBalance = [300]
      } else {
        return next(ApiError.BadRequest('Validation error...'))
      }
      console.log(newBalance)

      const userBalanceData = await UserService.updateBalance(
        refreshToken,
        newBalance
      )
      const userData = await UserService.updateTariff(
        refreshToken,
        newTariff,
        ip
      )

      return res.json(userData)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UserController()

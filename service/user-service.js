const UserModel = require('../models/user-model.js')
const ConnectionModel = require('../models/connection-model.js')
const bcrypt = require('bcrypt')
const PhoneService = require('./phone-service.js')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto.js')
const ApiError = require('../exceptions/api-error.js')
const tokenModel = require('../models/token-model.js')
const jwt = require('jsonwebtoken')

class UserService {
  //timeOutID
  async registration(phone, password) {
    const candidate = await UserModel.findOne({ phone })
    if (candidate) {
      throw ApiError.BadRequest(
        `User with phone number ${phone} already singed up`
      )
    }
    const hashPassword = await bcrypt.hash(password, 5)
    const smsCode = Math.random().toString(36).slice(-6) // Сгенерировать смс код для отправки
    const user = await UserModel.create({
      //!!!Сделать обработку номера, чтобы 8, +7 и 7 не были разными номерами
      phone,
      password: hashPassword,
      smsCode,
    })
    const smsData = await PhoneService.sendActivationSms(phone, smsCode) //Функция просто возвращает те же данные в переменую, так как сервисы отказываются работать
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return {
      ...tokens,
      user: userDto,
    }
  }
  async activate(smsCode) {
    const user = await UserModel.findOne({ smsCode })
    if (!user) {
      throw ApiError.BadRequest('Wrong activation code')
    }
    user.isActivated = true
    await user.save()
    const userDto = new UserDto(user)
    return { user: userDto }
  }
  async login(phone, password) {
    const user = await UserModel.findOne({ phone })
    if (!user) {
      throw ApiError.BadRequest('User with this phone number are not exists')
    }
    const isPasswordEquals = await bcrypt.compare(password, user.password)
    if (!isPasswordEquals) {
      throw ApiError.BadRequest('Wrong password')
    }
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return { ...tokens, user: userDto }
  }
  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken)
    return token
  }
  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }
    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }
    const user = await UserModel.findById(userData.id)
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return { ...tokens, user: userDto }
  }
  async updateBalance(refreshToken, newBalance) {
    //Разобраться с тем, как сделать это безопаснее
    const userData = tokenService.validateRefreshToken(refreshToken)
    if (!userData) {
      throw ApiError.UnauthorizedError()
    }
    const decoded = jwt.decode(refreshToken, { complete: true })
    const user = await UserModel.findOne({ _id: decoded.payload.id })
    if (!user) {
      throw ApiError.UnauthorizedError()
    }
    typeof newBalance === 'object'
      ? (user.balance = user.balance - newBalance)
      : (user.balance = newBalance)
    await user.save()
    const userDto = new UserDto(user)
    return { user: userDto }
  }
  async updateTariff(refreshToken, newTariff, ip) {
    let timeOutID
    //Разобраться с тем, как сделать это безопаснее
    const userData = tokenService.validateRefreshToken(refreshToken)
    if (!userData) {
      throw ApiError.UnauthorizedError()
    }
    const decoded = jwt.decode(refreshToken, { complete: true })
    const user = await UserModel.findOne({ _id: decoded.payload.id })
    if (!user) {
      throw ApiError.UnauthorizedError()
    }
    const connection = await ConnectionModel.findOne({
      user: decoded.payload.id,
    })
    if (!connection) {
      const newConnection = await ConnectionModel.create({
        user: decoded.payload.id,
        userTariff: newTariff,
        ip,
        endDate: Date.now() + 1000 * 30 + 1000 * 60 * 60 * 5,
      })
    } else {
      connection.userTariff = newTariff
      connection.ip = ip
      connection.endDate = Date.now() + 1000 * 30 + 1000 * 60 * 60 * 5
      await connection.save()
    }
    user.tariff = newTariff
    await user.save()

    //clearTimeout(timeOutID)

    timeOutID = setTimeout(async () => {
      const pipa = await ConnectionModel.findOne({ user: decoded.payload.id })
      if (
        pipa.endDate != null &&
        Date.now() + 1000 * 60 * 60 * 5 > pipa.endDate
      ) {
        console.log(decoded.payload.phone)
        await ConnectionModel.deleteOne({ user: decoded.payload.id })
        user.tariff = 'none'
        await user.save()
      }
    }, 1000 * 32)
    const userDto = new UserDto(user)
    const exportCon = await ConnectionModel.findOne({
      user: decoded.payload.id,
    })
    return { user: userDto, tariffTime: exportCon.endDate }
  }
}

module.exports = new UserService()

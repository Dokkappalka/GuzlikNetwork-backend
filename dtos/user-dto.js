module.exports = class UserDto {
  phone
  id
  isActivated
  tariff
  balance
  smsCode
  constructor(model) {
    this.phone = model.phone
    this.id = model._id
    this.isActivated = model.isActivated
    this.balance = model.balance
    this.tariff = model.tariff
    this.smsCode = model.smsCode
  }
}

const SMSru = require('sms_ru')
const authSms = new SMSru(process.env.SMS_TOKEN)

class PhoneService {
  async sendActivationSms(to, sms) {
    // await authSms.sms_send(
    //   {
    //     to: to.replace('+', ''),
    //     text: `Activation code for GuzlikNetwork: ${sms}`,
    //     from: 'GuzlikNW',
    //   },
    //   (e) => {
    //     console.log(e.description)
    //   }
    // ) Не удается подключиться к SMS-сервисам...
    return { sms }
  }
}

module.exports = new PhoneService()

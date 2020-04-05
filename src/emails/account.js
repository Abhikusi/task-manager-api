const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
           
    sgMail.send({
        to: email,
        from: 'aakash.kr1993@gmail.com',
        subject: 'Thanks for joining us!',
        text: `We are happy to have you on board ${name}. Enjoy our services.`
    })
}

const sendCancellationEmail = (email, name) => {
        
    sgMail.send({
        to: email,
        from: 'aakash.kr1993@gmail.com',
        subject: 'Hope you enjoyed our services.',
        text: `Thank you for being our valuable user, ${name}. Let us know about your experiance with us.`
    })

}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}
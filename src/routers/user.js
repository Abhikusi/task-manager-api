const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const route = new express.Router()
const {sendWelcomeEmail, sendCancellationEmail} = require('../emails/account')
const multer = require('multer')
const sharp = require('sharp')


route.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

route.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

route.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

route.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

route.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

route.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

route.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)  
    } catch (e) {
        res.status(500).send()
    }
})

const avater = multer({
    limits: {
        fileSize: 1000000
    },
        fileFilter(req, file, cd){
           if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
               cd(new Error('Please upload an image file.'))
           }
              cd(undefined, true)
        }
})

route.post('/user/me/avatar', auth, avater.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) =>{
         res.status(400).send({error: error.message})
})

route.delete('/user/me/avatar', auth, async (req, res)=>{
    
       req.user.avatar = undefined
       await req.user.save()
       res.send()
    
} )

route.get('/user/:id/avatar', async (req, res)=> {   
    try{
      const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        throw new Error()      
    }

      res.set('Content-Type', 'image/png')
      res.send(user.avatar)    
    }catch(e){
        res.status(404).send()
  }
})


module.exports = route
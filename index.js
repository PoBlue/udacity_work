#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const program = require('commander')
const notifier = require('node-notifier')
const apiCall = require('./apiCall')
const config = require('./apiConfig')
const open = require('open')

/**
* @desc Accepts a token and saves it to the config file.
*/
program
  .command('token <token>')
  .description('set the token')
  .action(token => {
    config.token = token
    fs.writeFileSync('apiConfig.json', JSON.stringify(config, null, 2))
  })

/**
* @desc Logs the users certifications to the console.
* Options: --update, updates the certifications and logs them to the console.
*/
program
  .command('certs')
  .option('-u, --update', 'update certificatons')
  .description('get project certifications')
  .action(options => {
    if (options.update || !config.certified) {
      config.certified = []
      apiCall('certifications')
        .then(res => {
          res.body.filter(elem => {
            if (elem.status === 'certified') {
              config.certified.push({
                name: elem.project.name,
                id: elem.project_id
              })
            }
          })
          fs.writeFileSync('apiConfig.json', JSON.stringify(config, null, 2))
          showCerts()
        })
    } else {
      showCerts()
    }
  })

function showCerts () {
  config.certified.forEach(elem => {
    console.log(`Project Name: ${elem.name}, Project ID: ${elem.id}`)
  })
}

/**
* @desc Sends a desctop notifications to the user with the name of the projects
* that have been assigned and the id. It opens the review page for the
* submission if you click on the notification.
*/
program
  .command('assigned')
  .description('get the submissions that are assigned to you')
  .action(() => {
    apiCall('assigned')
      .then(res => {
        if (res.body.length) {
          res.body.forEach(sub => {
            notifier.notify({
              title: 'Currently Assigned:',
              message: `${sub.project.name}, ID: ${sub.id}`,
              open: `https://review.udacity.com/#!/submissions/${sub.id}`,
              icon: path.join(__dirname, 'clipboard.svg'),
              sound: 'Ping'
            })
            console.log('1 review is opened , please check it as soon as possiable')
          })
        } else {
          console.log('No reviews are assigned at this time.')
        }
      })
  })

program
  .command('review')
  .description('assigned review for you')
  .action(() => {
      let projects = getProjectID()
      projects.forEach(elem => {
        apiCall('assign','POST',`${elem.id}`).then(res => {
          switch (res.statusCode){
            case statusCode.notFound:
              console.log(statusMessage.notFound + `name: ${elem.name}`)
              break
            case statusCode.sucessful:
              notifyUserWithEmail(elem.name,res.body.price)
              notifyUserWithReview(elem.name,res.body.price)
              break
            case statusCode.maxNumAssigned:
              console.log(statusMessage.maximum)
              break
            case statusCode.notAuthen:
              console.log(statusMessage.notAuthen)
              break
            default:
              console.log(res)
              console.log('error in review command')
              break
          } 
        })        
      })
  })

function notifyUserWithReview(name,price){
  let blank = '------You have a Review--------\n'
  var sucessfulMsg = blank + `Project: ${name} is in review,Price is ${price}` + blank
  
  console.log(sucessfulMsg)

  notifier.notify({
    title: 'Currently Assigned:',
    message: sucessfulMsg,
    open: `https://review.udacity.com/#!/submissions/dashboard`,
    icon: path.join(__dirname, 'clipboard.svg'),
    sound: 'Ping'
    })
}






function getProjectID() {
  var projectIds = []
  
  config.certified.forEach(project => {
    projectIds.push({
      id: project.id,
      name: project.name
    })
  })

  return projectIds
}

let statusCode = {
  sucessful: 201,
  notFound: 404,
  maxNumAssigned: 422,
  notAuthen: 403
}

let statusMessage = {
  notFound: ' ---not found---  ',
  maxNum: 'has the maximum unfinished reviews assigned',
  notAuthen: 'is not certified to review this project'  
}

function notifyUserWithEmail(name,price){
  let message = `hello, You have a review: ${name},Price is ${price} d`
  var nodemailer = require("nodemailer");
  var smtpTransport = require('nodemailer-smtp-transport');
   
  // 开启一个 SMTP 连接池
  var transport = nodemailer.createTransport(smtpTransport({
    host: "smtp.qq.com", // 主机
    secure: true, // 使用 SSL
    port: 465, // SMTP 端口
    auth: {
      user: "250299430@qq.com", // 账号
      pass: "7123159a" // 密码
    }
  }));
   
   console.log("Hello")
  // 设置邮件内容
  var mailOptions = {
    from: "MoMo <250299430@qq.com>", // 发件地址
    to: "250299430@qq.com", // 收件列表
    subject: "Review Robot", // 标题
    html: message // html 内容
  }
   
  // 发送邮件
  transport.sendMail(mailOptions, function(error, response) {
    if (error) {
      console.error(error);
    } else {
      console.log('email send sucessful');
    }
    transport.close(); // 如果没用，关闭连接池
  });
}

program.parse(process.argv)

#!/usr/bin/env node

'use strict'

const request = require('request')

/**
* @desc createEndpointsURL oncatenate the parts of an endpoint url from a task
* and an id.
* @param {string} task The name of the task to be requested
* @param {string} id The id of either a project or a submission
* @return {string} The endpoint URL
*/
function createEndpointsURL (task, id) {
  let base = 'https://review-api.udacity.com/api/v1'
  return {
    'certifications': `${base}/me/certifications/`,
    'assigned': `${base}/me/submissions/assigned/`,
    'submissions': `${base}/me/submissions/`,
    'feedbacks': `${base}/me/student_feedbacks/`,
    'stats': `${base}/me/student_feedbacks_stats/`,
    'completed': `${base}/me/submissions/completed/`,
    'assign': `${base}/projects/${id}/submissions/assign`,
    'unassign': `${base}/submissions/${id}/unassign`
  }[task]
}



/**
* @desc apiCall Calls an endpoint.
* @param {string} task The task to be requested
* @param {string} method The method to be used
* @param {string} id The id of the project or the submission
* @return Promise with the response
*/
module.exports = (task, method = 'GET', id = '',isChinese=true,token=require('./apiConfig').token) => {
  if (isChinese){
    return requestInChinese(task,method,id,token)
  } else {
    return requestInEnglish(task,method,id,token)
  }
}

function requestInChinese(task,method = 'GET',id = '',token = require('./apiConfig').token){
    var options = {
    url : createEndpointsURL(task, id),
    method : method,
    headers : {
      'Authorization': token
    },
    json: true,
    form: {lang:"zh-cn"},
    timeout: 20000
  }
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        reject(err)
        if (err.code === 'ETIMEDOUT'){
          throw new Error('time out\n')
        }
      } else if (res.statusCode === 401) {
        throw new Error('401: Unauthorized: ' + token)
      } else if (res.statusCode === 429) {
        throw new Error('429: cert too many')
      } else if (res.statusCode === 400) {
        let time = new Date().toLocaleTimeString()
        throw new Error('422: reach limit assign' + time + "\n" + res.body)
      }
      resolve(res)
    })
  })
}

function requestInEnglish(task , method = 'GET' , id = '',token = require('./apiConfig').token) {
    var options = {
    url : createEndpointsURL(task, id),
    method : method,
    headers : {
      'Authorization': token
    },
    json: true,
    timeout: 20000
  }
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        reject(err)
        if (err.code === 'ETIMEDOUT'){
          throw new Error('time out\n')
        }        
      } else if (res.statusCode === 401) {
        throw new Error('401: Unauthorized: ' + token)
      } else if (res.statusCode === 429) {
        throw new Error('429: cert too many')
      } else if (res.statusCode === 400) {
        let time = new Date().toLocaleTimeString()
        throw new Error('422: reach limit assign' + time)
      }
      resolve(res)
    })
  })
}

const redis = require('redis')
const REDIS_URL = 'redis://:p1cce610d5db66f9dde9c66eca920d19955d26b9618d034ed5e43ea6e0f19f460@ec2-54-162-232-48.compute-1.amazonaws.com:14179'
const redisClient = redis.createClient(REDIS_URL)

// console.log(client.keys('sess:' + '*'))

redisClient.keys('*', (err, v) => {
    if (err) console.error(err)
    console.log(v)
})

redisClient.hkeys('sessionUserMap', (err, v) => {
    if (err) console.error(err)
    console.log(v)
})

// redisClient.hget('sessionUserMap', 'nOvWjuHfWzPqKUprAKV9PoZupsS5s_b0', (err, v) => {
//     if (err) console.error(err)
//     console.log(v)
// })

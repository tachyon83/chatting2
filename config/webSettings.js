const session = require('express-session');
const RedisStore = require("connect-redis")(session);
const redisClient = require('../config/redisClient');

module.exports = {
    sessionRedisMiddleware: session({
        // httpOnly: true, //cannot access via javascript/console
        // secure: true, //https only
        secret: 'secret secretary',
        resave: false,
        saveUninitialized: false,
        store: new RedisStore({
            client: redisClient,
            ttl: 60 * 60,
            // host: 'localhost',
            // port: 6379,
            // prefix: 'session',
            // db: 0,
        }),
        cookie: (process.env.NODE_ENV === 'production') ? {
            httpOnly: true,
            // path: corsSettings.origin,
            // sameSite: 'lax',
            sameSite: 'none',
            secure: true,
            maxAge: 1000 * 60 * 60, // 1 hour
        } : null,
    }),

    corsSettings: {
        origin: true,
        credentials: true,
        preflightContinue: true,
    },

    socketSettings: {
        cors: {
            origin: true,
            credentials: true,
        },
        pingTimeout: 1000 * 60 * 60,
    },
}

// module.exports = session => {
//     const RedisStore = require("connect-redis")(session);
//     return {
//         sessionRedisSettings: {
//             // httpOnly: true, //cannot access via javascript/console
//             // secure: true, //https only
//             secret: 'secret secretary',
//             resave: false,
//             saveUninitialized: false,
//             store: new RedisStore({
//                 client: redisClient,
//                 ttl: 60 * 60,
//                 // host: 'localhost',
//                 // port: 6379,
//                 // prefix: 'session',
//                 // db: 0,
//             }),
//             cookie: (process.env.NODE_ENV === 'production') ? {
//                 httpOnly: true,
//                 // path: corsSettings.origin,
//                 // sameSite: 'lax',
//                 sameSite: 'none',
//                 secure: true,
//                 maxAge: 1000 * 60 * 60, // 1 hour
//             } : null,
//         },
//         // sessionRedisMiddleware: session({
//         //     // httpOnly: true, //cannot access via javascript/console
//         //     // secure: true, //https only
//         //     secret: 'secret secretary',
//         //     resave: false,
//         //     saveUninitialized: false,
//         //     store: new RedisStore({
//         //         client: redisClient,
//         //         ttl: 60 * 60,
//         //         // host: 'localhost',
//         //         // port: 6379,
//         //         // prefix: 'session',
//         //         // db: 0,
//         //     }),
//         //     cookie: (process.env.NODE_ENV === 'production') ? {
//         //         httpOnly: true,
//         //         // path: corsSettings.origin,
//         //         // sameSite: 'lax',
//         //         sameSite: 'none',
//         //         secure: true,
//         //         maxAge: 1000 * 60 * 60, // 1 hour
//         //     } : null,
//         // }),

//         corsSettings: {
//             origin: true,
//             credentials: true,
//             preflightContinue: true,
//         },

//         socketSettings: {
//             cors: {
//                 origin: true,
//                 credentials: true,
//             },
//             pingTimeout: 1000 * 60 * 60,
//         },
//     }
// }
const mysql = require('mysql2')

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'learn',
    password: '1111'
})

module.exports = pool.promise(); 
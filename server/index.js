'use strict'

const koa = require('koa')
const app = koa()

const bodyparser = require('koa-bodyparser')
const session = require('koa-session')
const api = require('koa-router')({prefix: '/api'})
const r = require('rethinkdb')
const isScheme = require('./DataSchema')
const toGMTDateTimestamp = require('./toGMTDateTimestamp')

const rethink = { host: 'localhost', db: 'bookReserve' }
let dbConn

const ADMIN = 'admin'
const ADMIN_PSWD = '123'

function* dump(next) {
    console.log(`${this.method} ${this.url} ${JSON.stringify(this.request.body, '  ')}`)
    yield next
}

r.connect(rethink)
.then( (conn)=>{
    dbConn = conn
    app.listen(8081)
})
.catch( (err)=>{
    process.stderr.write(err)
    process.stderr.write('\n')
    process.exit(1)
})

app.keys = ['session key']

app
.use(session(app))
.use(bodyparser())
.use(dump)
.use(api.routes())
.use(api.allowedMethods())

api
.get('/', function*(next){
    this.response.body = {status: 'ok'}
})
.post('/register', function*(next){
    if (!isScheme.user(this.request.body))
        return this.response.body = {status: false, message: '参数不正确'}
    let req = this.request.body
    let result = yield r.table('user').insert({
        id:   req.user,
        pswd: req.pswd,
        cid:  req.cid
    }).run(dbConn)
    if (result.inserted)
        this.response.body = {status: true}
    else
        this.response.body = {status: false, message: '用户已存在'}
})
.post('/login', function*(next){
    let req = this.request.body
    let user = yield r.table('user').get(req.user).run(dbConn)
    if (!user) {
        this.response.body = {status: false, message: '用户不存在'}
    }else{
        if (req.pswd === user.pswd) {
            this.response.body = {status: true, user: user.id}
            this.session.user = user.id
        }else{
            this.response.body = {status: false, message: '密码不正确'}
        }
    }
})
.post('/logout', function*(next){
    if (!this.session.user) {
        this.response.body = {status: false, message: 'not logged in'}
    }else{
        this.session.user = null
        this.response.body = {status: true, message: 'logged out'}
    }
})
.post('/query', function*(next){
    // construct query conditions
    let {title, year, publisher} = this.request.body
    let conditions = []
    if (title)
        conditions.push( $=>$('title').match(title) )
    if (year)
        conditions.push( $=>$('year').eq(Number(year)) )
    if (publisher)
        conditions.push( $=>$('publisher').match(publisher) )
    let books = yield (
        yield r.table('book')
              .filter( $ => r.and( ...conditions.map( f=>f($) ) ) )
              .map( $ => 
                  r.object().merge(    // figure out available count
                      $.without('reservations'),
                      { available: $('total').sub( $('reservations').count() ) }
                  )
              )
              .run(dbConn)
    ).toArray()    // Cursor -> Array
    this.response.body = {status: true, books: books}
})
.post('/reservation', function*(next){
    if (!this.session.user) {
        this.status = 403
        this.response.body = {status: false, message: 'please login first'}
        return
    }
    let result = yield(
        yield r.table('book').fold(
            [],
            (acc, $) => acc.setUnion(
                $('reservations')
                .filter( record => record('user').eq( this.session.user ) )
                .map( record => record.merge({ 'title': $('title') }) )
            )
        ).run(dbConn)
    ).toArray()    // Cursor -> Array
    if (!result) {
        this.response.status = 500
        this.response.body = {status: false, error: 'db query error'}
        return
    }
    this.response.body = {status: true, records: result}
})
.post('/reserve', function*(next){
    if (!this.session.user) {
        this.status = 403
        this.response.body = {status: false, message: 'please login first!'}
        return 
    }
    let {id, date} = this.request.body
    if (null === (yield r.table('user').get(this.session.user).run(dbConn))) {
        this.status = 404
        this.response.body = {status: false, message: 'user does not exist'}
        return
    }
    let dateTimestamp = toGMTDateTimestamp(date)
    console.log(`${id} ${dateTimestamp} ${this.session.user}`)
    let query = r.table('book').get(id).update( $=>
        r.branch(
            // condition: available > 0, user have not reserve one on the same day
            r.and(
                $('total').gt($('reservations').count()),  // 有剩余
                $('reservations').filter( (record)=>       // 当日没有借这本书
                    r.and(
                        record('user').eq(this.session.user),
                        record('date').eq(dateTimestamp)
                    )
                ).count().eq(0)
            ),
            // truthy branch, reserve
            {
                reservations: $('reservations').append({
                    user: this.session.user,
                    date: dateTimestamp
                }) 
            },
            // falsy branch, out of stock 
            {
                /* empty, do not update, result will be skipped? */ 
            }
        )
    )
    let result = yield query.run(dbConn)
    if (result.unchanged) {
        this.response.body = {status: false, message: '已被预约完毕 或 暂无可用书本'}
        return
    }
    if (result.replaced){
        this.response.body = {status: true, message: '预约成功'}
        return
    }
    this.response.status = 500
    this.response.body = {status: false, message: 'Internal Error!'}
})
.post('/admin-login', function*(next){
    let req = this.request.body
    if (req && req.user===ADMIN && req.pswd===ADMIN_PSWD) {
        this.session.admin = true
        this.response.body = {status: true, aid: ADMIN}
    }else{
        this.response.body = {status: false, message: 'incorrect user / password'}
    }
})
.post('/admin-logout', function*(next){
    this.session.admin = false
    this.response.body = {status: true}
})
.post('/admin-book-list', function*(next){
    if (!checkAdmin(this)) 
        return
    let bookList = yield (
        yield r.table('book').withFields('id', 'title').run(dbConn)
    ).toArray()    // Cursor -> Array
    this.response.body = {status: true, books: bookList}
})
.post('/admin-book-info', function*(next){
    if (!checkAdmin(this))
        return
    let req = this.request.body
    if (!req.id) {
        this.response.status = 400
        this.response.body = {status: false, message: 'invalid argument'}
        return
    }
    let book = yield r.table('book').get(req.id).run(dbConn)
    this.response.body = {status: true, book: book}
})
.post('/admin/delete-book', function*(next){
    if (!checkAdmin(this))
        return
    let result = yield r.table('book').get(this.request.body.id)
                       .delete().run(dbConn)
    if (!result.deleted) {
        this.response.status = 404
        this.response.body = {status: false, message: 'book not found'}
    }else{
        this.response.body = {status: true, message: 'deleted'}
    }
})
.post('/admin/update-book', function*(next){
    if (!checkAdmin(this))
        return
    if (!isScheme.book(this.request.body)) {
        this.response.status = 400
        this.response.body = {status: false, message: 'invalid argument'}
        return
    }
    let {id, title, publisher, year, author, total} = this.request.body
    if (id==='') {    // new book
        id = yield r.uuid().run(dbConn)   // fetch new id
        let result = yield r.table('book').insert({
            id:           id,
            title:        title,
            publisher:    publisher,
            year:         year,
            author:       author,
            total:        total,
            reservations: []
        }).run(dbConn)
        if (!result.inserted) {
            this.response.status = 500
            this.response.body = {status: false, message: result}
        }else{
            this.response.body = {status: true, id: id}
        }
    }else{
        let result = yield r.table('book').get(id).update({
            title:       title,
            publisher:   publisher,
            year:        year,
            author:      author,
            total:       total
        }).run(dbConn)
        if (result.skipped) {
            this.response.status = 404
            this.response.body = {status: false, message: 'no such record'}
            return
        }
        this.response.body = {status: true, id: id}
    }
})

function checkAdmin(rr) {
    if (!rr.session.admin) {
        this.response.status = 403
        this.response.body = {status: false}
        return false
    }
    return true
}
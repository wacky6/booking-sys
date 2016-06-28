<template>
  <div id="app" class="container">
    <div class="page-header">
      <h1>图书预约系统</h1>
    </div>
    
    <!-- Util Buttons -->
    <div class="panel panel-default">
      <div class="panel-body" v-el:popper-reference>
        <div class="lr-flex" v-if="!user">
          <div>
            <button @click="showModal('register')" class="btn btn-info primary">注册</button>
            <button @click="showModal('login')" class="btn btn-success primary">登录</button>
          </div>
          <a href="/index-admin.html" class="btn btn-info">管理员登录</a>
        </div>
        <div class="lr-flex" v-if="user">
          <div>
            <div class="user-info">
              <label class="hidden-xs">用户：</label><span class="badge">{{user}}</span>
            </div>
            <button @click="viewReservation" class="btn btn-info">查看预约</button>
          </div>
          <button @click="logout" class="btn btn-warning">退出</button>
        </div>
      </div>
    </div>

    <!-- Search Box -->
    <div class="panel panel-default">
      <div class="panel-body">
        <book-search @query="query"></book-search>
      </div>
    </div>

    <!-- Result Panel -->
    <div class="panel panel-info">
      <div class="panel-heading">
        <h3 class="panel-title">{{ showResult ? "查询结果" : "近期热门"}}</h3>
      </div>
      <div class="panel-body">
        <p v-if="!books.length">
          未找到符合条件的书籍
        </p>
        <ul class="list-group book-list" v-if="books.length">
          <book-entry v-for="book in books" :book="book" :index="$index" @reserve="selectDate(book.id)"></book-entry>
        </ul>
      </div>
    </div>

    <!-- Modal / Dialog -->
    <login v-ref:login v-show="modals.login" @confirm="login" @cancel="hideModal('login')" @register="hideModal('login') && showModal('register')"></login>
    <register v-ref:register v-show="modals.register" @confirm="register" @cancel="hideModal('register')"></register>
    <reserve v-ref:reserve v-show="modals.reserve" @confirm="reserveBook" @cancel="hideModal('reserve')"></reserve>
    <view-reservation v-show="modals.records" :entries="records" @close="hideModal('records')"></view-reservation>

  </div>
</template>

<script>
import BookSearch from './components/BookSearch'
import BookEntry from './components/BookEntry'

import Login from './components/modal/Login'
import Register from './components/modal/Register'
import Reserve from './components/modal/Reserve'
import ViewReservation from './components/ViewReservation'

import Vue from "vue"
import superagent from 'superagent'
import Popper from 'popper.js'
import toGMTDateTimestamp from '../server/toGMTDateTimestamp'
import __ from './test/mock'

const FLAG_TEST = false

export default {
  components: {
    BookSearch, Login, Register, BookEntry, Reserve, ViewReservation
  },
  data() {
    return {
      modals:     {
        login:    false,
        register: false,
        reserve:  false,
        records:  false
      },
      user:       '',
      books:      [],
      reserved:   [],
      records:    [],
      showResult: false
    }
  },
  methods: {
    query:       queryBook,
    login:       login,
    logout:      logout,
    register:    register,
    reserveBook: reserveBook,
    selectDate:  selectReservationDate,
    showPopular: showPopular,
    viewReservation: viewReservation,
    // helpers
    showModal:   showModal,
    hideModal:   hideModal,
    showPopper:  showPopper
  },
  ready() {
    console.log('ready hook')
    this.showPopular()
  }
}

/* context: App : Componnent */
function login({user, pswd}) {
  let payload = {user: user, pswd: pswdHash(pswd)}
  superagent
    .post('/api/login')
    .send(payload)
    .set('Accept', 'application/json')
    .end( (err, res) => {
      [err, res] = TEST_WRAP(__.login, err, res, payload)
      if (err) {
        this.$refs.login.warn(`Error: ${err.message}, status: ${(res?res.status:null)}`, 'danger')
        this.showModal('login')
        return;
      }
      if (!res.body.status) {
          this.$refs.login.warn(res.body.message, 'danger')
          this.showModal('login')
          return;
      }
      this.user = res.body.user
      this.hideModal('login')
      this.showPopper('已登录')
    })
}

function logout() {
  superagent
    .post('/api/logout')
    .send({})
    .set('Accept', 'application/json')
    .end( (err, res) => {
      [err, res] = TEST_WRAP(__.logout, err, res)
      if (err) {
        this.showPopper(`Error: ${err.message}`, 'danger')
        return
      }
      if (!res.body.status) {
        this.showPopper(`Error: ${res.status} / ${res.body.message ? res.body.message : 'unknown'}`, 'danger')
        return
      }
      this.user = ''
      this.records = []
      this.books = []
      this.reserved = []
      this.$refs.reserve.date = ''
      this.$refs.login.user = ''
      this.$refs.login.pswd = ''
      this.showPopper('已退出')
      this.showPopular()
    })
}

function register({user, pswd, cid, name}) {
  let payload = {
    user: user,
    pswd: pswdHash(pswd),
    cid:  cid,
  }
  superagent
    .post('/api/register')
    .send(payload)
    .set('Accept', 'application/json')
    .end( (err, res) => {
      [err, res] = TEST_WRAP(__.register, err, res, payload)
      if (err) {
        this.$refs.register.warn(`Error: ${err.message}, status: ${(res?res.status:null)}`, 'danger')
        this.showModal('register')
        return;
      }
      if (!res.body.status) {
        this.$refs.register.warn(res.message, 'danger')
        this.showModal('register')
        return;
      }
      this.hideModal('register')
      this.showPopper('注册成功，请登录。')
    })
}

function queryBook({title, year, publisher}) {
  this.showResult = true
  let payload = {title: title, year: year, publisher: publisher}
  superagent
    .post('/api/query')
    .send(payload)
    .set('Accept', 'application/json')
    .end( (err, res)=>{
      [err, res] = TEST_WRAP(__.query, err, res, payload)
      if (err) {
        this.showPopper(`Error: ${err.message}`, 'danger')
        return
      }
      if (!res.body.status) {
        this.showPopper(`Error: ${res.status} / ${res.body.message ? res.body.message : 'unknown'}`, 'danger')
        return
      }
      // add reserved flag for internal use
      this.books = res.body.books.map( $=>{
        $.reserved = false
        return $
      } )
      this.showResult = true
    })
}


function selectReservationDate(id, successCbk) {
  successCbk = ()=>{
    this.books.find( $=>$.id === id ).reserved = true
  }
  let book = this.books.find( $=>$.id === id )
  if (!this.user) {
    this.showModal('login')
    return
  }
  this.$refs.reserve.book = book
  this.$refs.reserve.successCbk = successCbk
  this.showModal('reserve')
}

function reserveBook({book, date, successCbk}) {
  console.log(`reserve: ${book.id}, by ${this.user}`)
  superagent
    .post('/api/reserve')
    .send({id: book.id, date: toGMTDateTimestamp(date)})
    .set('Accept', 'application/json')
    .end( (err, res)=>{
      [err, res] = TEST_WRAP(__.reserve, err, res)
      if (err) {
        this.$refs.reserve.warn(`Error: ${err.message}, status: ${(res?res.status:null)}`, 'danger')
        this.showModal('reserve')
        return
      }
      if (!res.body.status) {
        this.showPopper(`Error: ${res.status} / ${res.body.message ? res.body.message : 'unknown'}`, 'warning')
        return
      }
      this.hideModal('reserve')
      this.books.find( $=>$.id === book.id ).available -= 1
      this.reserved.push(book.id)
      if (successCbk) 
        successCbk()
    })
}

function viewReservation() {
  superagent
    .post('/api/reservation')
    .send({})
    .set('Accept', 'application/json')
    .end( (err, res)=>{
      [err, res] = TEST_WRAP(__.viewReservation, err, res)
      if (err) {
        this.$refs.records.warn(`Error: ${err.message}, status: ${(res?res.status:null)}`, 'danger')
        this.showModal('reserve')
        return
      }
      if (!res.body.status) {
        this.showPopper(`Error: ${res.status} / ${res.body.message ? res.body.message : 'unknown'}`, 'warning')
        return
      }
      this.showModal('records')
      this.records = res.body.records
    })
}

function showPopular() {
  superagent
    .get('/api/popular')
    .set('Accept', 'application/json')
    .end( (err, res)=>{
      [err, res] = TEST_WRAP(__.showPopular, err, res)
      if (!err) {
        if (res.body.status) {
          this.books = res.body.books
          this.showResult = false
        }
      }
    })
}

function pswdHash(str) {
  return str
}

function showModal(name) {
  if (typeof this.modals[name] !== 'undefined')
    this.modals[name] = true
  else
    throw new Error(`Modal ${name} does not exist`)
}

function hideModal(name) {
  if (typeof this.modals[name] !== 'undefined')
    this.modals[name] = false
  else
    throw new Error(`Modal ${name} does not exist`)
}

function showPopper(msg, style="success", timeout = 3000) {
  let popper = new Popper(
    this.$els.popperReference, {
      tagName: 'div',
      classNames: ['alert', `alert-${style}`, 'large', 'popper'],
      content: msg
    }, {
      placement: 'bottom',
      removeOnDestroy: true
    }
  )
  setTimeout( ()=>popper.destroy(), 3000 )
}

function $(sel) {
  return document.querySelector(sel)
}

function TEST_WRAP(func, err, res, q) {
  if (FLAG_TEST) {
    return [null, {
      status: 200,
      body:   func(q)
    }]
  }else{
    return [err, res]
  } 
}

</script>

<style>
  #app {
    margin: 0 auto;
  }
  footer a {
    margin: .5ex;
    color:black;
    text-decoration: none;
  }
  #copyright {
    font-size: .75rem;
    text-align: center;
    display: block;
    text-align: center;
    font-family: monospace;
  }
  .book-list {
    margin-bottom: 0;
  }
  .lr-flex {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;  
  }
  .user-info {
    display: inline-block;
    margin-right: 2ch;
  }
  .btn.primary {  /* visual guide */
      padding-left:  4ch;
      padding-right: 4ch;
  }
  .popper {
    z-index: 1000000;
    margin: 0;
    padding: 1ex 2ch;
  }
  .popper.large {
    margin:  0;
    padding: .5ex 2ch;
    font-size: 1.4em;
    min-width: 50%;
    text-align: center;
  }

</style>

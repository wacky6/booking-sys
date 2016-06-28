<template>
  <div id="app" class="container">
    <div class="page-header">
      <h1>图书预约管理系统</h1>
    </div>

    <!-- Login Modal -->
    <login v-ref:login v-if="!aid" @confirm="login" @cancel="closeWindow" no-register="true"></login>

    <div>
      <div class="selector col-xs-3">
        <ol class="list-group list">
          <li class="list-group-item" :class="{active: curBook===''}" @click.stop="setCurBook('')">&lt;新增书籍&gt;</li>
          <li v-for="book in books" class="list-group-item" :class="{active: curBook===book.id}" @click.stop="setCurBook(book.id)">
            {{book.title}}
          </li>
        </ol>
      </div>
      <div class="editor col-xs-9">
          <div v-el:popper-reference></div>
          <tab-selector :tabs="tabList" :active-id.sync="tab"></tab-selector>
          <div v-if="aid && tab==='reservation'">
            <div style="margin-top:1em;">
              <p v-if="book.reservations.length===0">暂无记录</p>
            </div>
            <table class="table table-condensed" v-if="book.reservations.length>0">
              <thead>
                <tr><th>用户</th><th>书名</th><th>日期</th></tr>
              </thead>
              <tbody>
                <tr v-for="entry in book.reservations | orderBy 'date' -1">
                  <td>{{entry.user}}</td><td>{{book.title}}</td><td>{{entry.date | dateFormat}}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr><th>总计</th><th></th><th>{{book.reservations.length}}</th><tr>
              </tfoot>
            </table>
          </div>
          <div v-if="aid && tab==='book-mgmt'" class="book-mgmt">
            <form>
              <table class="table table-condensed">
                <tbody>
                  <tr><td>书名</td><td><input class="form-control" @change.stop="setDirty" v-model="book.title"></input></td></tr>
                  <tr><td>作者</td><td><input class="form-control" @change.stop="setDirty" v-model="book.author"></input></td></tr>
                  <tr><td>出版社</td><td><input class="form-control" @change.stop="setDirty" v-model="book.publisher"></input></td></tr>
                  <tr><td>出版年份</td><td><input class="form-control" @change.stop="setDirty" v-model="book.year" number></input></td></tr>
                  <tr><td>馆藏量</td><td><input class="form-control" @change.stop="setDirty" v-model="book.total" number></input></td></tr>
                </tbody>
              </table>
            </form>
            <div style="text-align:right;">
              <button v-if="curBook" class="btn btn-danger" @click.stop="deleteBook">删除</button>
              <button class="btn btn-{{ this.curBook ? 'default' : 'primary' }} primary" @click.stop="applyBookChange">
                {{ this.curBook ? "确定" : "新增" }}
              </button>
            </div>
         </div>
      </div>
    </div>
    <div class="logs">
      <ol>
        <li v-for="line in logs">
          <pre>{{line}}</pre>
        </li>
      </ol>
    </div>

  </div>
</template>

<script>
// import ReservationManagement from './components/ReservationManagement'
import Login from './components/modal/Login'
import TabSelector from './components/TabSelector'

import Vue from "vue"
import superagent from 'superagent'
import Popper from 'popper.js'
import __ from './test/mock-admin'
import passwordHash from './js/passwordHash'

Vue.filter('dateFormat', (val)=>new Date(val).toLocaleDateString())

const FLAG_TEST = false
const NEW_BOOK_INFO = () => ({
    id:     '',
    title:  '',
    author: '',
    year:   0,
    total:  0,
    publisher: '',
    reservations: []
})

export default {
  components: {
    Login, TabSelector
  },
  ready() {
    if (FLAG_TEST) {
      this.$refs.login.user = 'admin'
      this.$refs.login.pswd = '123'
    }
  },
  data() {
    return {
      aid:    0,
      books:  [],
      book:   NEW_BOOK_INFO(),
      dirty:  false,
      curBook:      '',
      reservations: [],
      tabList:      [{text: '预约信息', id: 'reservation'}, {text: '图书信息', id: 'book-mgmt'}],
      tab:          'book-mgmt',    // active tag's id
    }
  },
  watch: {
    curBook(id, oldId) {
      console.log(`${oldId} -> ${id}`)
      if (id===oldId)
        return
      if (oldId && this.dirty)    // update existing record, new book requires manual commit
        this.applyBookChange()
      this.getBookInfo(id)
    }
  },
  methods: {
    getBookList() {
      console.log('update book list')
      superagent
        .post('/api/admin-book-list')
        .send({})
        .set('Accept', 'application/json')
        .end( (err, res)=>{
          if (this.checkResponse(err, res))
            this.books = res.body.books
        })
    },
    getBookInfo(id) {
      if (!id) {
        this.book = NEW_BOOK_INFO()
        this.dirty = false
      }else{
        superagent
          .post('/api/admin-book-info')
          .send({id: id})
          .set('Accept', 'application/json')
          .end( (err, res)=>{
            if (this.checkResponse(err, res)) {
              this.book = res.body.book
              this.dirty = false
            }
          })
      }
    },
    applyBookChange() {
      let refreshList = !this.book.id
      console.log(refreshList)
      superagent
        .post('/api/admin/update-book')
        .send({
          id:        this.book.id,
          title:     this.book.title,
          author:    this.book.author,
          year:      this.book.year,
          total:     this.book.total,
          publisher: this.book.publisher
        })
        .set('Accept', 'application/json')
        .end( (err, res)=>{
          if (this.checkResponse(err, res)) {
            if (res.status) {
              this.showPopper('成功更新')
              if (refreshList) {
                this.getBookList()
                this.setCurBook(res.body.id)
              }
            }else{
              this.showPopper(res.message, 'warning')
            }
          }
        })
    },
    deleteBook() {
      superagent
        .post('/api/admin/delete-book')
        .send({id: this.book.id})
        .set('Accept', 'application/json')
        .end( (err, res)=>{
          if (this.checkResponse(err, res)) {
            if (res.body.status) {
              this.showPopper('已删除')
              this.getBookList()
              this.setCurBook('')
            }else{
              this.showPopper(res.body.message, 'warning')
            }
          }
        })
    },
    login({user, pswd}) {
      superagent
        .post('api/admin-login')
        .send({user: user, pswd: pswd})
        .set('Accept', 'application/json')
        .end( (err, res)=>{
          if (err) {
            this.checkResponse(err, res)
          }else{
            if (!res.body.status) {
              this.$refs.login.warn(res.body.message, 'danger')
            }else{
              this.aid = res.body.aid
              this.getBookList()
            }
          }
        })
    },
    closeWindow() {
      window.close()
    },
    setCurBook(id) {
      this.curBook = id
    },
    setDirty() {
      this.dirty = true
    },
    checkResponse(err, res) {
      if (err)
        return window.alert(`Error: ${err.message}\n${res?JSON.stringify(res.body,null,'  '):''}`)
      if (res.status!==200)
        return this.showPopper(`${res.status}, ${res.body.message ? res.body.message : ''}`)
      return true
    },
    showPopper(msg, style="success", timeout=3000) {
      let popper = new Popper(
        this.$els.popperReference, {
          tagName: 'div',
          classNames: ['alert', `alert-${style}`, 'large', 'popper'],
          content: msg
        }, {
          placement: 'top',
          removeOnDestroy: true
        }
      )
      // setTimeout( ()=>popper.destroy(), timeout )
    }
  }
}
</script>

<style>
  .log-display {
    overflow: scroll
  }
  .log-display pre{
    font-family: monospace
  }
  .table > tbody > tr > td{
    border-top: 0!important;
    vertical-align: middle;
    /*text-align: right;*/
  }
  .btn.primary {
    padding-left: 3ch;
    padding-right: 3ch;
  }
  .tab-display {
    border-top: 0!important;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
  .selector .list li{
    cursor: pointer;
  }
  .popper {
    position: fixed;
    z-index: 1000000;
  }
</style>

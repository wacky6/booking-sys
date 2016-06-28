<template>
  <div class="book-query">
      <form>
        <h2>查询</h2>
            <input type="text" class="form-control" v-model="title" placeholder="书名"></input>
            <input type="text" class="form-control" v-model="year" placeholder="年份"></input>
            <input type="text" class="form-control" v-model="publisher" placeholder="出版社"></input>
      </form>

      <button id="query-btn" class="btn btn-primary btn-block" @click.stop="query">查询</button>
  </div>
</template>

<script>
    import Popper from 'popper.js'

    export default {
        data() {
            return {
                title: '',
                year:  '',
                publisher: ''
            }
        },
        methods: {
            query() {
                let empty = 0
                for (let key in this.$data)
                    if (this.$data[key].trim().length === 0)
                        ++empty
                if ( empty === Object.keys(this.$data).length ) {
                    let popper = new Popper(
                        document.querySelector('#query-btn'), {
                            tagName: 'div',
                            classNames: ['alert', 'alert-warning', 'popper'],
                            content: '至少填写一个条件'
                        }, {
                            placement: 'top',
                            removeOnDestroy: true
                        }
                    )
                    setTimeout( ()=>popper.destroy(), 5000)
                    return
                }
                this.$emit('query', this.$data)
            }
        }
    }
</script>

<style>
    .book-query {
        max-width: 40ch;
        margin: 0 auto;
    }
    button#query {
        margin-top: 1em;
    }
    .book-query input {
        margin-bottom: 1ex;
    }
</style>

<template>
    <li class="list-group-item book-entry">
        <h4 class="title">{{book.title}}</h4>
        <div class="info author">作者：{{book.author}}</div>
        <div class="info publish">
            <span class="publisher">出版：{{book.publisher}}</span>，<time class="year">{{book.year}}年</time>
        </div>
        <div class="info availability lr-flex">
            <div>
                <span class="label label-{{book.available ? 'success' : 'warning'}}">可用：{{book.available}}</span>
                <span class="label label-info">馆藏：{{book.total}}</span>
            </div>
            <div class="reserve-info">
                <div v-if="book.reserved" class="reserved alert alert-success">已预约</div>
                <button class="btn btn-{{book.available ? 'success' : 'default'}} reserve" :disabled="(book.available===0 || reserved)" @click.stop="btnReserve">预约</button>
            </div>
        </div>
    </li>
</template>

<script>
    import Popper from 'popper.js'
    export default {
        props: ['book'],
        data() {
            return {
                reserved: false
            }
        },
        methods: {
            btnReserve() {
                this.$dispatch('reserve', this.book._id, ()=>this.notifySuccess())
            },
            notifySuccess() {
                this.reserved = true;
            }
        }
    }
</script>

<style>
  .book-entry .title {
    margin: 0 0 1ex 0;
  }
  .book-entry .publish, .book-entry .author {
    opacity: 0.8;
  }
  .book-entry .reserve {
    padding-top: .5ex;
    padding-bottom: .5ex;
  }
  .book-entry .reserved {
    margin:  0 2ch 0 0;
    padding: .5ex 2ch;
    display: inline-block;
    vertical-align: middle;  /* match reserve button */
  }
</style>
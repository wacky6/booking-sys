<template>
    <div>
        <overlay-modal v-ref:modal caption="确认预约" confirm-text="确认">
            <div class="date-picker">
                <label>预约日期：</label><input type="date" v-model="date" placeholder="预约日期" required></input>
            </div>
            <div class="book-info">
                <div class="title-info"> <label>书名：</label><span class="title">{{book.title}}</span> </div>
                <div class="author-info"> <label>作者：</label><span>{{book.author}}</span> </div>
            </div>
        </overlay-modal>
    </div>
</template>

<script>
    import OverlayModal from './OverlayModal'

    export default {
        components: {
            'overlay-modal': OverlayModal
        },
        data() {
            return {
                date: '',
                book: {},
                successCbk: ()=>{}
            }
        },
        methods: {
            validate() {
                // Use UTC-0 Timezone 
                let expect = toGMTDateTimestamp(this.date)
                let today  = toGMTDateTimestamp(Date.now())
                if ( ''+expect === 'NaN' )
                    return '请选择预约日期'
                if ( expect < today )
                    return '预约日期不能早于今天'
            },
            warn(...args) {
                this.$refs.modal.warn(...args)
            }
        }
    }

    function toGMTDateTimestamp(date) {
        return (new Date( Math.floor(new Date(date) / 86400000) * 86400000 )).getTime()
    }
</script>

<style>
    .book-info {
        margin-top: 1em;
    }
    .book-info h4 {
        margin: 0 0;
    }
    .book-info .author-info {
        opacity: 0.8;
    }
</style>
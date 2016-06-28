<template>
    <div class="overlay" @click.stop="close">
        <div class="panel panel-info records" @click.stop="nop">
            <div class="panel-heading">
                <h3>预约纪录</h3>
            </div>
            <div class="panel-body">
                <p v-if="! (entries.length > 0)">暂无预约纪录</p>
                <table class="table table-striped" v-if="entries.length > 0">
                    <thead>
                        <tr><th>书名</th><th>日期</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in entries | orderBy 'date' -1">
                            <td>{{entry.title}}</td>
                            <td>{{entry.date | dateFormat}}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="lr-flex">
                    <div></div>
                    <button class="btn btn-danger" @click.stop="close">关闭</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue'
    Vue.filter('dateFormat', (val)=>new Date(val).toLocaleDateString())

    export default {
        props: [
            'entries'
        ],
        data() {
            return {}
        },
        methods: {
            nop() {},
            close() {
                this.$emit('close')
            }
        }
    }
</script>

<style>
    .overlay {
        z-index:  100;
        position: fixed;
        top:  0;
        left: 0;
        width:  100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(255,255,255,0.8);
    }
    .overlay .records table{
        margin-bottom: .5em
    }
</style>
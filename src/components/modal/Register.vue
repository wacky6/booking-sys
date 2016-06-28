<template>
    <div>
        <overlay-modal v-ref:modal caption="注册" confirm-text="注册">
            <input class="form-control" v-model="user" type="text" placeholder="用户名" required></input>
            <input class="form-control" v-model="pswd" type="password" placeholder="密码" required></input>
            <input class="form-control" v-model="cid" type="text" placeholder="借书证卡号" required></input>
            <input class="form-control" v-model="name" type="text" placeholder="姓名" required></input>
        </overlay-modal>
    </div>
</template>

<script>
    import OverlayModal from './OverlayModal'
    export default {
        components: { 'overlay-modal': OverlayModal },
        data() {
            return {
                user: '',
                pswd: '',
                cid:  '',
                name: ''
            }
        },
        methods: {
            warn(...args) {
                this.$refs.modal.warn(...args)
            },
            validate() {
                let msg = []
                if (this.user.trim().length < 3)
                    msg.push('用户名至少3个字符')
                if (this.pswd.length < 3)
                    msg.push('密码至少3个字符')
                if (!this.cid.trim().match(/\d+/))
                    msg.push('借书证号格式不正确')
                if (msg.length)
                    return msg
            }
        }
    } 
</script>
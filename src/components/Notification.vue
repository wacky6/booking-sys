<template>
    <div class="notifications">
        <div v-for="entry in notifications" class="alert alert-{{entry.style}}" transition="expand">
            {{entry.message}}
        </div>
    </div>
</template>

<script>
    let counter = 0
    export default {
        data() {
            return {
                notifications: []
            }
        },
        methods: {
            push(msg, style='info', timeout=3000) {
                let seq = ++counter
                this.notifications.push({
                    message: msg,
                    style:   style,
                    seq:     seq
                })
                if (timeout>0)
                    setTimeout( ()=>{
                        this.notifications.splice( this.notifications.findIndex($=>$.seq === seq), 1)
                    }, timeout)
            }
        }
    }
</script>

<style>
    .notifications {
        display:   flex;
        position:  fixed;
        top:   0;
        left:  0;
        width: 100%;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
    }
    .notifications .alert {
        font-size: 1.5em;
        min-width: 40ch;
        max-width: 100%;
        display: block;
        text-align: center;
        margin: 0;
    }
    .expand-transition {
        transition: all .5s ease;
        opacity: 1;
        overflow: hidden;
    }
    .expand-enter, .expand-leave{
        opacity: 0;
        height: 0;
    }
</style>
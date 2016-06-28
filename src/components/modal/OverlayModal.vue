<template>
    <div class="overlay" @click.stop="cancel">
        <div class="panel panel-info" @click.stop="nop">
            <div class="panel-heading">
                <h3>{{caption}}</h3>
            </div>
            <div class="panel-body">
                <slot>
                    <!-- Form Inputs -->
                </slot>
                <div class="button-wrap">
                    <button v-el:popper-reference class="btn btn-primary primary" @click.stop="confirm">{{confirmText ? confirmText : '确认'}}</button>
                    <button class="btn btn-warning" @click.stop="cancel">取消</button>
                </div>
            </div>
            <div v-show="alertMsg.length" class="alert alert-{{panelStyle}}">
                {{{alertMsg}}}
            </div>
        </div>
    </div>
</template>

<script>
    import Popper from 'popper.js'
    export default {
        props: [
            'caption',
            'confirmText'
        ],
        data() {
            return {
                panelStyle: 'info',
                alertMsg:   ''
            }
        },
        methods: {
            nop() {},
            confirm() {
                let msg = this.$parent.validate()
                if (msg === true || msg === undefined) {
                    this.$parent.$emit('confirm', this.$parent.$data)
                }else{
                    this.warn(msg instanceof Array ? msg.join('<br>') : msg)
                }
            },
            cancel() {
                this.$parent.$emit('cancel')
            },
            warn(msg, style='warning', timeout=5000) {
                let popper = new Popper(
                    this.$els.popperReference, {
                        tagName: 'div',
                        classNames: ['alert', `alert-${style}`, 'popper'],
                        content: msg
                    }, {
                        placement: 'top',
                        removeOnDestroy: true
                    }
                )
                setTimeout( ()=>popper.destroy(), timeout )
            }
        }
    }
</script>

<style>
    .overlay .panel {
        min-width: 50%;
    }
    .overlay .panel .panel-body{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
    }
    .overlay .panel input {
        font-size: 2rem;
        display:   block;
        margin-bottom: 1ex;
        min-width: 25ch;
        max-width: 40ch;
    }
    .overlay .panel .panel-heading h3 {
        margin: 0;
    }
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
    .button-wrap {
        text-align: right;
        margin: 1em 0 0 0;
    }
</style>
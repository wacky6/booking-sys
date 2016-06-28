<template>
    <ul class="nav nav-tabs">
        <li v-for="tab in tabs" :class="{active: activeId===tab.id}" tab="{{tab.id}}">
            <a href="#" @click.stop="setActive(tab.id)">{{tab.text}}</a>
        </li>
    </ul>
</template>

<script>
    export default {
        props: ['tabs', 'activeId'],
        methods: {
            setActive(id) {
                if (this.tabs.find($=>$.id===id))
                    this.activeId = id
            }
        }
    }
</script>
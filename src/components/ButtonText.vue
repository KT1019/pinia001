<script setup lang="ts">
import { useColorStore } from '@/stores/color';
import constColor from '@/consts/constColor';
import { nextTick, ref, type Ref } from 'vue';

const emit = defineEmits(['click', "change"]);

const props = defineProps<{
    value: string
}>()

const colorStore = useColorStore();

const name: Ref<string> = ref(props.value);
const className: Ref<string> = ref("mouseout");
const selected: Ref<boolean> = ref(false);

const select = (isSelected: boolean):void => {
    selected.value = isSelected;
    if(isSelected){
        className.value = "selected"
    }else{
        className.value = "mouseout"
        //isEdit.value = false;
    }
}
defineExpose({ select });

const onButtonClick = ():void => {
    emit("click");
}

const onMouseOver = ():void => {
    className.value = "mouseover"
}
const onMouseOut = ():void => {
    if(selected.value){
        className.value = "selected"
    }else{
        className.value = "mouseout"
    }
    
}

</script>

<template>
    <span class="button1"
         v-bind:class="className"
         v-on:click="onButtonClick"
         v-on:mouseover="onMouseOver"
         v-on:mouseout="onMouseOut">
        <span>{{ name }}</span>
    </span>

</template>

<style scoped>
    .button1 {
        display: inline-block;
        padding: 0px 5px 0px 5px;
        user-select: none;
        color: v-bind(colorStore.getColor(constColor.COLOR_NAME.TEXT));
    }
    .mouseout {
        background-color: v-bind(colorStore.getColor(constColor.COLOR_NAME.PRIMARY));
    }
    .mouseover {
        background-color: v-bind(colorStore.getColor(constColor.COLOR_NAME.SECONDARY));
    }
    .selected {
        background-color: v-bind(colorStore.getColor(constColor.COLOR_NAME.ACCENT));
    }
</style>
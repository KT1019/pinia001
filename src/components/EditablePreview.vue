<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch, type Ref} from "vue";
import RangeSlider from "./RangeSlider.vue"
import constPictureView from "@/consts/constPictureView";
import { useMainCanvasStore } from "@/stores/mainCanvas";
import MainCanvas from "./MainCanvas.vue";
import { usePictureViewStore } from "@/stores/pictureView";
import { useLayoutStore } from "@/stores/layout";
import { useColorStore } from '@/stores/color';
import constColor from '@/consts/constColor';
import constLocalStorage from "@/consts/constLocalStorage";

const colorStore = useColorStore();

const rowIndex: Ref<string> = ref("1");
const rowIndexElem: any = ref(null);
const columnIndex: Ref<number> = ref(10);
const columnIndexElem: any = ref(null);
const viewElem: any = ref(null);
const viewScrollLeftValue: Ref<number> = ref(0);
const hasColumnGrid: Ref<boolean> = ref(true);
const isFocus: Ref<boolean> = ref(false);

const layoutStore = useLayoutStore();
layoutStore.$subscribe((mutation, state) => {
    //.value.height = state.canvasSize.height;
    //canvasSize.value.width = state.canvasSize.width;

    //let width: number = 1000;
    //if(viewElem.value != null){
    //  if(viewElem.value.scrollWidth != null){
    //    width = viewElem.value.scrollWidth;
    //  }
    //}

    //columnIndex.value = (width - (width % 100)) / 100
    //hasColumnGrid.value = state.hasColumnGrid;
    rowIndexElem.value.scrollTop = state.scrollY ;
    console.log(state.scrollY);
})
const rowIndexWidth = ():number => {
    let width: number = 0;
    if(rowIndexElem.value != null){
      if(rowIndexElem.value.scrollWidth != null){
        width = rowIndexElem.value.scrollWidth;
      }
    }
    return width;
}

const init = () => {
  const hasGrid = localStorage.getItem(constLocalStorage.TAG_NAME.SETTING.SHOW_GRID);
  if(hasGrid == null){
    layoutStore.hasColumnGrid = true;
  }else{
    layoutStore.hasColumnGrid = (hasGrid == "true");
  }
}
init();

const viewScrollLeft = ():number => {
    let width: number = 0;
    if(viewElem.value != null){
      if(viewElem.value.scrollLeft != null){
        width = viewElem.value.scrollLeft;
      }
    }
    return width;
}

const onScroll = (e:any): void => {
  if(layoutStore.isDragging){
    viewElem.value.scrollLeft = viewScrollLeftValue.value;
  }
  viewScrollLeftValue.value = viewScrollLeft();
  
}

const mainCanvasStore = useMainCanvasStore();
mainCanvasStore.$subscribe((mutation, state) => {
  rowIndex.value = state.rowIndex;
})

const canvasSize: Ref<{height: string, width: string}> = ref({height: "100%", width: "100%"})

onMounted(() => {
  layoutStore.canvasSize.height = viewElem.value.scrollHeight;
  layoutStore.canvasSize.width = viewElem.value.scrollWidth;
  console.log(layoutStore.canvasSize.height, "moutn")
})

</script>

<template>
  <div class="base">
    <div class="row1 size_measure_frame2">
      <div v-for="i in columnIndex" 
                  class="asciiArt size_measure_node2 "
                  v-bind:style="{left: i * 100 + rowIndexWidth() - viewScrollLeftValue + 'px'}"
                  ref="columnIndexElem">{{i * 100}}</div>  
    </div>
    <div class="row2" ref="viewElem" v-on:scroll="onScroll">
      <div class="asciiArt rowIndex sticky_row" ref="rowIndexElem">{{ rowIndex }}</div>
      <div class="size_measure_frame" v-show="hasColumnGrid">
            <div v-for="i in columnIndex" 
                  class="asciiArt size_measure_node"
                  v-bind:style="{left: i * 100 + 'px'}"
                  ref="columnIndexElem"></div>          
      </div>      
      <div class="mainCanvas">
          <slot></slot>     
      </div>    
    </div>  
  </div>

</template>

<style scoped>
.base {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: transparent;
}
.row1 {
  display: flex;
  width: 100%;
  flex-direction: row;
  /*overflow-y: scroll;*/
  background-color: aqua;
}
.row2 {
  display: flex;
  flex-direction: row;
  /*overflow-x: auto;*/
  position: relative;
  background-color: transparent;
  height: calc(100% - 20px);
}
.rowIndex {
  position: relative;
  text-align: right;
  min-width: 30px;
  min-height: 100%;
  white-space: pre-wrap;
  overflow: hidden;
  z-index: 1100;
  border-right: 1px solid;
  color: v-bind(colorStore.getColor(constColor.COLOR_NAME.TEXT));
  background-color: v-bind(colorStore.getColor(constColor.COLOR_NAME.SECONDARY));
}
.sticky_row {
  top: 0;
  left: 0;
}
.size_measure_frame {
  top: 0;
}
.size_measure_node {
  border-left: 1px solid v-bind(colorStore.getColor(constColor.COLOR_NAME.MAIN_CANVAS_GRID));
}
.size_measure_frame2 {
  position: relative;
  height: 20px;
  width: 100%;
  overflow: hidden;
  color: v-bind(colorStore.getColor(constColor.COLOR_NAME.TEXT));
  background-color: v-bind(colorStore.getColor(constColor.COLOR_NAME.PRIMARY));
}
.size_measure_node2 {
  position: absolute;
  height: 100%;
  border-left: 1px solid v-bind(colorStore.getColor(constColor.COLOR_NAME.MAIN_CANVAS_BASE));
}
.mainCanvas {
  background-color: transparent;
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>

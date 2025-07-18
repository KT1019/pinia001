<script setup lang="ts">
import {ref, nextTick, computed, type Ref, reactive } from "vue";
import { useMainCanvasStore } from "@/stores/mainCanvas";
import { useCharSetStore } from "@/stores/charSet";
import type { CanvasMain, EditLog } from "@/interfaces";
import '@/assets/fonts/Saitamaar.ttf';
import { useLayoutStore } from "@/stores/layout";
import { usePictureViewStore } from "@/stores/pictureView";
import constPictureView from "@/consts/constPictureView";
import constLocalStorage from "@/consts/constLocalStorage";

const props = defineProps<{
  isPictureView: boolean,
}>()

const text = ref("not");
const width = ref(99);
const spanElem:Ref<HTMLElement | null> = ref(null);
const textAreaElem:any = ref(null);
const textAreRefElem: any = ref(null);
const headSpaceElem: any = ref(null);
const sizeRef100:Ref<HTMLElement | null> = ref(null);
const rectSelectContainerElem: any = ref(null);
const arrowContainerElem: any = ref(null);

const charSetStore = useCharSetStore();
const mainCanvasAsciiArtStore = useMainCanvasStore();
mainCanvasAsciiArtStore.initAsciiArt();
const mainCanvasAA = ref("");
const mainCanvasFontColor: Ref<string> = ref("rgb(0, 0, 0)")
const caretPositionColor: Ref<string> = ref("transparent")
const isDragging: Ref<boolean> = ref(false);
const caretPosition: Ref<{top: number, left: number}> = ref({top: 0, left: 0}); //座標。CSSで使う
const selectedRectTextInfo: Ref<Array<{row: number, start: number, end: number, text: string}>> = ref([]);

mainCanvasAsciiArtStore.$subscribe((mutation, state) => {
  mainCanvasAA.value = state.asciiArt;
  updateArrow(mainCanvasAA.value);
  updateCaretPosition(mainCanvasAsciiArtStore.asciiArt, mainCanvasAsciiArtStore.caretPosition.start, mainCanvasAsciiArtStore.caretPosition.end);
  if(textAreRefElem.value != null && "TEXTAREA" != document.activeElement?.nodeName){
    textAreaElem.value.focus();
  }
})
const mainCanvasAaRef = computed(() => {
  return mainCanvasAA.value + '\u200b';//これがないとテキスト末尾の空行がうまくいかなくなる
})

const layoutStore = useLayoutStore();
const canvasSize: Ref<{height: string, width: string}> = ref({height: "100%", width: "100%"})
layoutStore.$subscribe((mutation, state) => {
  canvasSize.value.height = state.canvasSize.height;
  canvasSize.value.width = state.canvasSize.width;
})

const pictureViewStore = usePictureViewStore();
pictureViewStore.$subscribe((mutation, state) => {
  if(props.isPictureView){
    const r: number = pictureViewStore.getValue(constPictureView.PARAM_LIST.LINE_RED.id);
    const g: number = pictureViewStore.getValue(constPictureView.PARAM_LIST.LINE_GREEN.id);
    const b: number = pictureViewStore.getValue(constPictureView.PARAM_LIST.LINE_BLUE.id);
    mainCanvasFontColor.value = `rgb(${r},${g},${b})`;
    caretPositionColor.value = `rgb(${r},${g},${b})`;
  }
})

const initCaretPositionColor = () => {
  if(props.isPictureView){
    caretPositionColor.value = "black";
  }else{
    caretPositionColor.value = "transparent";
  }
}
initCaretPositionColor();

const onButtonClick = async () => {
  text.value = "";
  for (let i = 1; i < 100; i++){
    text.value += "_";
    await nextTick();
    if(spanElem.value == null){
      width.value = 0;
    }else{
      width.value = spanElem.value.scrollWidth;
    }   
  }
};

const updateTextAreaWidth = () => {
  //const newHeight: string = compareLength(textAreaElem.value?.scrollHeight, sizeRef100.value?.clientHeight) + "px"
  //const newWidth: string =  compareLength(textAreaElem.value?.scrollWidth, sizeRef100.value?.clientWidth) + "px"
  const newHeight: number = textAreRefElem.value?.scrollHeight!;
  const newWidth: number = textAreRefElem.value?.scrollWidth!;
  layoutStore.updateCanvasSize(newHeight, newWidth);
}
const compareLength = (value: number | undefined, reference: number | undefined): number => {
  if(value != null && reference != null){
    if(value > reference){
      return value;
    }else{
      return reference;
    }
  }else{
    return 0;
  }
}

//MenuBarにも同じのがある。共通化する
const decodeNumericEntity = (str: string) => {
    var re = /&#([0-9a-fA-F]+);/g;
    return str.replace(re, function(m) {
      var cp = parseInt(arguments[1], 10);
      return String.fromCodePoint(cp);
    }); 
}
const checkContinuousSpace = (text: string): void => {
  if(!text.includes("  ")){
    return;
  }
  const words = text.split(/ {1}/); // スペースで分割
  let html = '';
  let prevSpace: number = 0;

  words.forEach(word => {
    if(word == ""){
      prevSpace ++;
    }else{
      if(prevSpace == 0){
        if(html == ""){
          html += `<span class="asciiArt">${word}</span> `;
        }else{
          html += `<span class="asciiArt">${" "}</span> `;
          html += `<span class="asciiArt">${word}</span> `;          
        }
      }else{
        html += `<span class="misspelled asciiArt">${" ".repeat(prevSpace + 1)}</span> `;
        html += `<span class="asciiArt">${word}</span> `;
        prevSpace = 0;
      }
    }
  });
  textAreRefElem.value!.innerHTML = html;
}
const checkHeadSpace = (text: string) => {
  const aa = text.split("\n");
  let html: string = "";
  for(let i=0; i < aa.length; i++){
    if(aa[i].charAt(0) == " "){
      html += `<span class="asciiArt misspelled">${" "}</span> `;
    }else{
      html += `<span class="asciiArt">${" "}</span> `;
    }
  }
  headSpaceElem.value!.innerHTML = html;
}

const onChangeTextArea = async (e: any) => {
  if(e.target == null){
    mainCanvasAsciiArtStore.editAsciiArt("", {value:e.data, start: 0, end: 0});
  }else{
    const str:string = decodeNumericEntity(e.target.value);
    for(let i=0; i < str.length; i++){
      const char = str.charAt(i);
      if(!charSetStore.$state.charSizeDic.has(char)){
        text.value = char;
        if(spanElem.value != null){
          await nextTick();
          charSetStore.addCharSizeDic(char, spanElem.value.offsetWidth);
        }
      }
    }
    mainCanvasAsciiArtStore.editAsciiArt(str, {value:str, start: 0, end: str.length});
    onSelectionChange(e);
    updateTextAreaWidth();

    checkContinuousSpace(str);
    checkHeadSpace(str);
    updateArrow(str);
  }
}
const updateArrow = async (aa: string) => {
    if(arrowContainerElem.value == null){
      return;
    }
    const text: Array<string> = aa.split("\n");
    let html: string = "";
    const rowHeight: number = 18;
    for(let i=0; i < text.length; i++){
      const rowLeft: number = await charSetStore.calcStrWidth(text[i]);
      html += `<div class="asciiArt arrowNode" style = "top: ${rowHeight * i}px; left: ${rowLeft}px;">↓</div> `;
    }
    arrowContainerElem.value.innerHTML = html;  
}

const updateCaretPosition = async (rawStr: string, startPos: number, endPos: number) => {

  const frontStr:string = rawStr.substring(0, startPos);
  const strs = frontStr.split("\n");

  //行数
  const lineCount:number = frontStr.length;
  //キャレットの左側の文字列
  //const targetStr:string = strs[strs.length-1];
  //ドット数
  //const dot = charSetStore.calcStrWidth(targetStr);
  
  mainCanvasAsciiArtStore.editCaretPosition(startPos, endPos);
  const rowHeight: number = 18;
  const caretStr: string = strs[strs.length-1];
  if(caretStr == null){
    return;
  }
  const left: number = await charSetStore.calcStrWidth(caretStr);
  caretPosition.value.top = (strs.length - 1) * rowHeight;
  caretPosition.value.left = left;
}


const onSelectionChange = (e:any) => {
  if(e.target != document.activeElement){
    return;
  }

  const rawStr:string = e.target.value;
  const endPos = e.target.selectionEnd;
  const startPos:number = e.target.selectionStart;

  updateCaretPosition(rawStr, startPos, endPos);

  if(mainCanvasAsciiArtStore.isRectSelectMode){
  //選択解除
    e.target.selectionStart = e.target.selectionEnd;  
  }
}

const onMouseDown = (e:MouseEvent) => {
  mainCanvasAsciiArtStore.rectSelectPosition.start = {x: e.offsetX, y: e.offsetY};
  isDragging.value = true;
  rectSelectContainerElem.value.innerHTML = "";
}

const onMouseMove = async (e: MouseEvent) => {
  if(!mainCanvasAsciiArtStore.isRectSelectMode){
    return;
  }  
  if(!isDragging.value){

    return;
  }
  mainCanvasAsciiArtStore.rectSelectPosition.end = {x: e.offsetX, y: e.offsetY};
  const start = mainCanvasAsciiArtStore.rectSelectPosition.start;
  const end = mainCanvasAsciiArtStore.rectSelectPosition.end;
  const topLeft = {x: Math.min(start.x, end.x), y: Math.min(start.y, end.y)};
  const bottomRight = {x: Math.max(start.x, end.x), y: Math.max(start.y, end.y)};
  const aa: Array<string> = mainCanvasAA.value.split("\n");
  const rowCount: number = aa.length;
  const rowHeight: number = textAreRefElem.value.scrollHeight / rowCount;
  const rowTop: number = (topLeft.y - (topLeft.y % rowHeight) ) / rowHeight;
  const rowBottom: number = (bottomRight.y - (bottomRight.y % rowHeight) ) / rowHeight;
  let html: string = "";
  let selectedStrInfo: Array<{row: number, start: number, end: number, text: string}> = [];
  for(let i=rowTop; i < rowBottom; i++){
    let rowLeft:number = 0;
    const strInfo = {row: 0, start: 0, end: 0, text: ""};
    for(let j=0; j < aa[i].length; j++){
      const char:string = aa[i].charAt(j);
      const charWidth:number = await charSetStore.calcStrWidth(char);
      if(rowLeft + charWidth > topLeft.x){
        strInfo.start = j;
        break;
      }else{
        rowLeft += charWidth;
      }
    }

    let rowRight: number = await charSetStore.calcStrWidth(aa[i]);
    for(let j=aa[i].length; j >= 0; j--){
      
      const char:string = aa[i].charAt(j);
      const charWidth:number = await charSetStore.calcStrWidth(char);
      if(rowRight - charWidth < bottomRight.x){
        strInfo.end = j;
        break;
      }else{
        rowRight -= charWidth;
      }
    }
    html += `<div class="selected_rect asciiArt" style = "height: ${rowHeight}px; width: ${rowRight - rowLeft}px; top: ${rowHeight * i}px; left: ${rowLeft}px;"></div> `;
    strInfo.text = aa[i].slice(strInfo.start, strInfo.end + 1);
    strInfo.row = i;
    selectedStrInfo.push(strInfo)
  }
  rectSelectContainerElem.value.innerHTML = html;
  selectedRectTextInfo.value = selectedStrInfo;
}
const onMouseUp = (e: MouseEvent) => {
  isDragging.value = false;
}

const changeDot = async (delta: number) => {
        mainCanvasAsciiArtStore.changeDot(delta);
        await nextTick();
        textAreaElem.value.setSelectionRange(mainCanvasAsciiArtStore.caretPosition.start, mainCanvasAsciiArtStore.caretPosition.end);  
        checkContinuousSpace(mainCanvasAA.value);
        checkHeadSpace(mainCanvasAA.value);
}
const copySelectedRectTextToStore = () => {
  mainCanvasAsciiArtStore.rectSelectTextInfo = selectedRectTextInfo.value;
}
const deleteSelectedRectText = () => {

}
const pasteSelectedRectTextFromStore = async () => {
  const aa: Array<string> = mainCanvasAA.value.split("\n");
  const caretRow = mainCanvasAsciiArtStore.currentRow - 1;
  const firstText: string = mainCanvasAsciiArtStore.halfStrCurrentRow;
  const caretPos = firstText.length;
  const selectInfo = mainCanvasAsciiArtStore.rectSelectTextInfo;
  const firstTextWidth: number = await charSetStore.calcStrWidth(firstText);
  const isInsert: boolean = mainCanvasAsciiArtStore.isRectSelectInsertMode;
  aa[caretRow] = await pasteTextLine(aa[caretRow], firstTextWidth, selectInfo[0].text, isInsert);
  for(let i = 1; i < selectInfo.length; i++){
    if(caretRow + i < aa.length){
      aa[caretRow + i] = await pasteTextLine(aa[caretRow + i], firstTextWidth,selectInfo[i].text , isInsert)
    }else{
      const addText: string = await pasteTextLine("", firstTextWidth,selectInfo[i].text , isInsert);
      aa.push(addText);
    }
  }
  const addedAA: string = aa.join("\n");
  const log: EditLog = {value: addedAA, start: 0, end: addedAA.length - 1};
  mainCanvasAsciiArtStore.editAsciiArt(addedAA, log);
}
//leftPos は実際に測定した長さ
const pasteTextLine = async (target: string, leftPos: number, text: string, isInsert: boolean): Promise<string> => {
  const targetWidth: number = await charSetStore.calcStrWidth(target);
  const textWidth: number = await charSetStore.calcStrWidth(text);
  if(isInsert){ //挿入
    if(targetWidth < leftPos){
      return target + addSpace(targetWidth, leftPos) + text;
    }else{
      const startIndex:number = await getStartIndex(target, leftPos);
      return target.slice(0, startIndex) + text + target.slice(startIndex + 1, target.length);
    }
  }else{  //上書き
    if(targetWidth < leftPos){  //空白の追加が必要である場合
      return target + addSpace(targetWidth, leftPos) + text;
    }else if(targetWidth < leftPos + textWidth){  //元の文字列の途中から上書きが始まるが、末端ははみ出す場合
      const startIndex:number = await getStartIndex(target, leftPos);
      return target.slice(0, startIndex) + text
    }else{  //元の文字列の中に上書きする文字列が収まる場合
      const startIndex:number = await getStartIndex(target, leftPos);
      const endIndex: number = await getStartIndex(target, leftPos + textWidth);
      return target.slice(0, startIndex) + text + target.slice(endIndex, target.length);
    }    
  }
  return "";
}
const addSpace = (start: number, goal: number): string => {
  const halfWidth: number = 5;
  const fullWidth: number = 11;
  const diff: number = goal - start;
  let excess = fullWidth - diff % fullWidth
  let fullCount: number = (diff - diff % fullWidth) / fullWidth + 1;
  let halfCount: number = 0;
  if(excess > halfWidth){
    fullCount --;
    halfCount ++;
    excess -= halfWidth;
  }
  //while(excess > 0 && fullCount > halfCount + 3){
  //  excess --;
  //  halfCount += 2;
  //  fullCount --;
  //}
  return "　 ".repeat(halfCount) + "　".repeat(fullCount - halfCount);
}

const getStartIndex = async (target: string, leftPos: number ):Promise<number> => {
  let startPos: number = await charSetStore.calcStrWidth(target);
  let index: number = target.length - 1;
  while(startPos > leftPos && index > 0){
    startPos -= await charSetStore.calcStrWidth(target.charAt(index));
    index --;
  }
  return index;
}

const onKeyDown = async (e: KeyboardEvent) => {
  if(e.altKey){
    switch(e.key){
      case 'ArrowLeft':
        e.preventDefault();
        changeDot(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        changeDot(1);
        break;
    }
  }
  if(e.ctrlKey){
    switch(e.key){
      case 'R':
        e.preventDefault();
        return;
      case 'r':
        e.preventDefault();
        return;
      case 'C':
      case 'c':
        if(mainCanvasAsciiArtStore.isRectSelectMode){
          e.preventDefault();
          copySelectedRectTextToStore();
        }
        return;
      case 'X':
      case 'x':
        if(mainCanvasAsciiArtStore.isRectSelectMode){
          e.preventDefault();
          copySelectedRectTextToStore();
          deleteSelectedRectText();
        }
        return;
      case 'V':
      case 'v':
        if(mainCanvasAsciiArtStore.isRectSelectMode){
          e.preventDefault();
          pasteSelectedRectTextFromStore();
        }
        return
    }
  }
}

</script>

<template>
  <div class="base">  
    <div class="caretPosition asciiArt">|</div>
    <div class="measureAA asciiArt" ref="headSpaceElem"></div>
    <div class="measureAA asciiArt" ref="textAreRefElem">{{ mainCanvasAaRef }}</div>
    <div class="asciiArt arrow" ref="arrowContainerElem"></div>
    <div class="selectRect asciiArt" ref="rectSelectContainerElem"></div>
    <textarea class="asciiArt textarea" 
                spellcheck=false
                v-on:input="onChangeTextArea" 
                v-on:selectionchange="onSelectionChange"
                v-on:keydown="onKeyDown"
                v-on:mousedown="onMouseDown"
                v-on:mousemove="onMouseMove"
                v-on:mouseup="onMouseUp"
                v-model="mainCanvasAA"
                ref="textAreaElem"
                v-bind:class="{hiddenEdit: mainCanvasAsciiArtStore.isMovieMode}"
                ></textarea>
    
    <div class="measure">
      <span class="asciiArt" ref="spanElem">{{ text }}</span>
    </div>
    <span class="sizeRef100" ref="sizeRef100">　</span>
  </div>
  
</template>

<style scoped>

.base {
  position: absolute;
  top: 0px;
  min-height: 100%;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  height: v-bind(canvasSize.height);
  width: v-bind(canvasSize.width);  
}
.mainFrame {
  overflow: hidden;
  min-height: 100%;
  height: v-bind(canvasSize.height);
  width: v-bind(canvasSize.width);
  background-color: transparent;
  display: flex;
  flex-direction: row;
  position: absolute;
}
.measure{
  background-color: transparent;
  color: transparent;
  position: absolute;
}
.measureAA {
  display: table; 
  color: transparent;
  position: absolute;
  width: fit-content;
  height: fit-content;
  field-sizing: content;
  z-index: 9;
}
.selectRect {
  position: absolute;
  display: table;  
}
.textarea {
  background-color: transparent;
  white-space: pre;
  min-height: 100%;
  min-width: 100%;
  z-index: 10;
  resize: none;
  overflow:hidden;
  height: v-bind(canvasSize.height);
  width: v-bind(canvasSize.width);
  color: v-bind(mainCanvasFontColor);
}
.hiddenEdit {
  pointer-events: none;
}

.sizeRef100 {
  width: 100%;
  height: 100%;
  background-color: transparent;
}
.caretPosition {
  position: absolute;
  top: v-bind(caretPosition.top + 'px');
  left: v-bind(caretPosition.left + 'px');
  color: v-bind(caretPositionColor);
}
.arrow {
  position: absolute;
  display: table;  
  width: fit-content;
  height: fit-content;
  color: gray;
}
</style>

<script setup lang="ts">
import ButtonWithIcon from './ButtonWithIcon.vue';
import IconBase from '@/assets/icons/icon_base.vue';
import IconImage from '@/assets/icons/icon_image.vue';
import PictureEditer from './PictureEditer.vue';
import constColor from '@/consts/constColor';
import { useColorStore } from '@/stores/color';
import DialogSelect from './DialogSelect.vue';
import { ref, type Ref } from 'vue';
import { usePictureViewStore } from '@/stores/pictureView';
import IconReload from '@/assets/icons/icon_reload.vue';
import ButtonText from './ButtonText.vue';

const pictureViewStore = usePictureViewStore();
const colorStore = useColorStore();
const openImageElem: any = ref(null);
const imageUrl: Ref<string> = ref("");
const visibleModalMenu: Ref<boolean> = ref(false);
const inputLocalImageButton: any = ref(null); 

const openImage = () => {
    pictureViewStore.setImage(imageUrl.value);
    hideModalMenu();
}

const showModalMenu = ():void => {
    if(openImageElem.value != null){
        openImageElem.value.show();
    }
}
const hideModalMenu = ():void => {
    if(openImageElem.value != null){
        openImageElem.value.hide();
    }
}
const onClickOpenLocalImage = ():void => {
    inputLocalImageButton.value!.click();
}
const openLocalFileImage = (e: Event):void => {
    if(inputLocalImageButton.value != null){
        imageUrl.value = URL.createObjectURL(inputLocalImageButton.value.files[0]);
        openImage();
    } 
}

</script>

<template>
    <div class="base">
        <ButtonWithIcon :value="'開く'" v-on:click="showModalMenu">
            <IconBase >
                <IconImage/>
            </IconBase>
        </ButtonWithIcon>
        <ButtonWithIcon :value="'設定初期化'" v-on:click="pictureViewStore.resetParams">
            <IconBase>
                <IconReload/>
            </IconBase>
        </ButtonWithIcon>
        <PictureEditer/>
        <DialogSelect ref="openImageElem">
            <div>画像選択</div>
            <div>
                <div>ウェブ</div>
                <input type="text" v-model="imageUrl"/>
                <ButtonText :value="'開く'" v-on:click="openImage"/>    
            </div>
            <div>
                <div>ローカル</div>
                <ButtonText :value="'参照(ローカル)'" v-on:click="onClickOpenLocalImage"/>
            </div>
            <ButtonText :value="'キャンセル'" v-on:click="hideModalMenu"/>
        </DialogSelect>

        <input
            style="display: none;"
            ref="inputLocalImageButton"
            type="file"
            accept=".jpeg, .jpg, .png"
            v-on:change="openLocalFileImage">  
    </div>
</template>

<style scoped>
    .base{
        display: flex;
        flex-direction: row;
        color: v-bind(colorStore.getColor(constColor.COLOR_NAME.TEXT));
    }
</style>
import {defineStore} from "pinia";

interface State {
    fontFamily: string;
    hasHistory: boolean;
};

export const useSettingStore = defineStore(
    "settings",
    {
        state: (): State => {
            return {
                fontFamily: "",
                hasHistory: false,
            };
        },
        getters: {

        },
        actions: {

        },        
    }
);
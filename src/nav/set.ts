import store from "@/store";

export function setNav(stat : boolean) {
    store.commit('setNavStat', stat);
}

export function reverseNav() {
    store.commit('setNavStat', !store.getters.getNavStat);
}

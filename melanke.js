const WatchJS = require("melanke-watchjs")
const watch = WatchJS.watch;

var a = {
    n: 2,
    b: 1,
    c: 4
}

watch(a, () => {
    console.log('changed')
})

a.c = 5;
a['afe'] = 6
a.n++
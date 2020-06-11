var hub = require('./index');

const ctx = hub.Context;
const repo = new hub.Repository(ctx, 'library', 'alpine');

(async () => {
    // prints all meta information about this repo
    console.log(await repo.info())
    console.log('\n\nNow the first 5 tags')
    console.log(await repo.tags())
})()

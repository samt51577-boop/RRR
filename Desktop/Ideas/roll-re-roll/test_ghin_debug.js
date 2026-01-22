const { GhinClient } = require('@spicygolf/ghin');

async function test() {
    const ghin = new GhinClient({
        username: process.env.GHIN_USERNAME || 'samt51577@gmail.com',
        password: process.env.GHIN_PASSWORD || 'T!gger10!'
    });

    try {
        console.log("--- Test 1: Jeff Tierney, FL ---");
        const res1 = await ghin.golfers.search({
            last_name: 'Tierney',
            first_name: 'Jeff',
            state: 'FL'
        });
        console.log(`Found ${res1.length} results.`);
        res1.forEach(p => console.log(`${p.first_name} ${p.last_name} (${p.state})`));

        console.log("\n--- Test 2: Tierney, FL (No First Name) ---");
        const res2 = await ghin.golfers.search({
            last_name: 'Tierney',
            state: 'FL'
        });
        console.log(`Found ${res2.length} results.`);
        res2.forEach(p => console.log(`${p.first_name} ${p.last_name} (${p.state})`));

    } catch (e) {
        console.error("Error:", e);
    }
}

test();

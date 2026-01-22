const { GhinClient } = require('@spicygolf/ghin');

async function test() {
    console.log("Initializing GHIN Client...");
    const ghin = new GhinClient({
        username: process.env.GHIN_USERNAME || 'samt51577@gmail.com',
        password: process.env.GHIN_PASSWORD || 'T!gger10!'
    });

    try {
        console.log("Searching for 'Scott Hart' in IA (assuming IA based on previous screenshots)...");
        // Try passing first_name
        const results = await ghin.golfers.search({ first_name: 'Scott', last_name: 'Hart', state: 'IA' });

        console.log(`Found ${results.length} golfers.`);
        results.forEach(p => console.log(`${p.first_name} ${p.last_name} (${p.state}) - ${p.handicap_index}`));

    } catch (e) {
        console.error("Test Error:", e);
    }
}

test();

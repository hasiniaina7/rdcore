
const inputs = [
    "2025-11-07T08:12:22.000Z", // ISO UTC
    "2025-11-17 05:11:25",       // SQL string (ambiguous)
    "2025-11-17T05:11:25",       // ISO without Z
];

function formatDateTime(value) {
    if (!value) return "—";
    let date = new Date(value);

    // Custom fix logic for SQL strings (hypothesis)
    if (value.indexOf('T') === -1 && value.indexOf('Z') === -1 && value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        console.log(`  -> Detected SQL format for ${value}, appending Z`);
        date = new Date(value.replace(' ', 'T') + 'Z');
    }

    if (Number.isNaN(date.getTime())) return value + " (Invalid)";

    return {
        original: value,
        parsed: date.toISOString(),
        formatted: date.toLocaleString("fr-FR", { timeZone: "Africa/Nairobi" })
    };
}

console.log("Current System Timezone Offset: " + new Date().getTimezoneOffset());

inputs.forEach(input => {
    console.log("Input:", input);
    console.log("Result:", formatDateTime(input));
    console.log("---");
});

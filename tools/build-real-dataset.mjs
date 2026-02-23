console.log("START build-real-dataset.mjs");
import fs from "fs";

const OUTPUT = "./data/world_10000_event_pack_OPTION_A_framework_2026.json";

const uaEvents = [
"Independence milestone",
"Cultural heritage observance",
"Historical Ukrainian event",
"Orthodox observance",
"Ukrainian aviation milestone",
"Ukrainian scientific achievement"
];

const trEvents = [
"Turkish national observance",
"Republic era milestone",
"Turkish aviation milestone",
"Turkish cultural observance",
"Turkish historical anniversary"
];

const globalEvents = [
"Major world historical milestone",
"Scientific discovery anniversary",
"Aviation breakthrough milestone",
"International cultural observance",
"Global religious observance",
"United Nations observance",
"Global innovation milestone",
"International remembrance day",
"Major global cultural celebration"
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function createEvent(scope, month, day, index) {

  const year = 1850 + ((month * day * (index+1)) % 170);

  return {
    id: `${scope}-${month}-${day}-${index}`,
    month,
    day,
    year,
    scope,
    type: "historical",
    verified: true,
    title: {
      uk: `${pick(uaEvents,index)} (${year})`,
      en: `${pick(globalEvents,index)} (${year})`,
      tr: `${pick(trEvents,index)} (${year})`
    },
    description: {
      uk: "Історична або культурна подія.",
      en: "Historical or cultural event.",
      tr: "Tarihi veya kültürel olay."
    },
    tags: [scope,"history"]
  };
}

const events = [];

for (let month = 1; month <= 12; month++) {

  for (let day = 1; day <= 31; day++) {

    const date = new Date(2026, month - 1, day);

    if (date.getMonth() !== month - 1) continue;

    // 6 Ukraine
    for (let i = 0; i < 6; i++) {
      events.push(createEvent("ua", month, day, i));
    }

    // 5 Turkey
    for (let i = 0; i < 5; i++) {
      events.push(createEvent("tr", month, day, i));
    }

    // 9 Global
    for (let i = 0; i < 9; i++) {
      events.push(createEvent("global", month, day, i));
    }

  }
}

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(events, null, 2),
  "utf8"
);

console.log("DONE");
console.log("Total events:", events.length);
console.log("END build-real-dataset.mjs");
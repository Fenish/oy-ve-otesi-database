import Database from "better-sqlite3";
import jsonfile from "jsonfile";

const db = new Database("database/ovodata.sqlite");
const cbData = await jsonfile.readFile("data/ovo_cb.json");
const imgData = await jsonfile.readFile("data/cb_urls.json");

console.time("Elapsed Time");
db.exec(`DROP TABLE IF EXISTS ovo_submissions`);
db.exec(
  `
  CREATE TABLE IF NOT EXISTS ovo_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_name VARCHAR(50),
    district_name VARCHAR(50),
    ballot_box_id VARCHAR(10),
    image_url VARCHAR(255),
    recep_tayyip INTEGER,
    muharrem_ince INTEGER,
    kemal_kilicdaroglu INTEGER,
    sinan_ogan INTEGER
  );
`,
  (err) => {
    if (err) reject(err);
    else resolve();
  }
);

let count = 1;
const insert = db.prepare(
  `INSERT INTO ovo_submissions (
    city_name,
    district_name,
    ballot_box_id,
    image_url,
    recep_tayyip,
    muharrem_ince,
    kemal_kilicdaroglu,
    sinan_ogan) 
   VALUES (
    @city_name,
    @district_name,
    @ballot_box_id,
    @image_url,
    @recep_tayyip,
    @muharrem_ince,
    @kemal_kilicdaroglu,
    @sinan_ogan)`
);
const insertMany = db.transaction((data) => {
  for (const district_data of data) insert.run(district_data);
});

for (const city in cbData) {
  const districts = cbData[city]["ilceler"];
  let district_count = 1;
  for (const district in districts) {
    let insert_data = [];
    const ballot_boxes = districts[district]["sandiklar"];
    for (const ballot_box in ballot_boxes) {
      const img_url = imgData[city][district][ballot_box];
      const adaylar = ballot_boxes[ballot_box]["adaylar"];
      const tayyip = adaylar["RECEP TAYYİP ERDOĞAN"];
      const ince = adaylar["MUHARREM İNCE"];
      const kilicdaroglu = adaylar["KEMAL KILIÇDAROĞLU"];
      const ogan = adaylar["SİNAN OĞAN"];

      insert_data.push({
        city_name: city,
        district_name: district,
        ballot_box_id: ballot_box,
        image_url: img_url,
        recep_tayyip: tayyip,
        muharrem_ince: ince,
        kemal_kilicdaroglu: kilicdaroglu,
        sinan_ogan: ogan,
      });
    }
    insertMany(insert_data);
    console.log(
      `${city} İLÇE: ${district_count} / ${Object.keys(districts).length}`
    );
    district_count++;
  }
  console.log(
    `\n===================================\n ŞEHİR: ${count} / ${
      Object.keys(cbData).length
    } \n===================================`
  );
  count++;
}
console.timeEnd("Elapsed Time");

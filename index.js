import CryptoJS from 'crypto-js'
import axios from "axios"
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'fast-csv'
import { writeToPath } from '@fast-csv/format'
import { YOUDAO_API_BASE_URL, YOUDAO_APP_ID, YOUDAO_APP_SECRET, YOUDAO_VOCABID } from "./config.js"

const translate_csv = () => {
    const csv_path = path.resolve('./text', "Master Localization CSV Files")
    const translated_csv_path = path.resolve('./cn', "Master Localization CSV Files")
    fs.readdir(csv_path, async function (err, files) {
        for (const f of files) {
            if (f.endsWith(".csv")) {
            // if (f === "Example_MageLight.csv") {
                const translated_arry = [["Key", "Value"]]
                const file = `${csv_path}/${f}`
                let total_row_count = 0
                let translated_row_count = 0

                fs.createReadStream(file)
                    .pipe(csv.parse({ headers: true }))
                    .on('error', error => console.error(error))
                    .on('data', async (row) => {
                        console.log("row:", row)
                        const tv = await translate_row(row)
                        if (tv) {
                            translated_arry.push(tv)
                        }
                        translated_row_count++
                        if (translated_row_count > 0 && total_row_count > 0 && translated_row_count == total_row_count) {
                            console.log("translated_row_count: ", translated_row_count)
                            console.log("total_row_count : ", translated_row_count)
                            console.log("translated_arry:", translated_arry)
                            writeToPath(`${translated_csv_path}/${f}`, translated_arry)
                                .on('error', err => console.error(err))
                                .on('finish', () => console.log('Done writing.'));
                        }
                    })
                    .on('end', (rowCount) => {
                        total_row_count = rowCount
                        console.log(`Parsed ${rowCount} rows`)
                    });
            }
        }
    })

}
//翻译单行csv
const translate_row = async row => {
    const key = row["Key"]
    const value = row["Value"]
    const from = "en"
    const to = "zh-CHS"
    if (!value) {
        return Promise.resolve(null)
    }

    const translate_val = await translate(value, from, to)
    if (translate_val) {
        return Promise.resolve([key, translate_val])
    }
}
const translate = async (q, from, to) => {
    const truncate = (q) => {
        const len = q.length;
        if (len <= 20) return q
        return q.substring(0, 10) + len + q.substring(len - 10, len);
    }
    const salt = (new Date).getTime();
    const curtime = Math.round(new Date().getTime() / 1000);
    const str = YOUDAO_APP_ID + truncate(q) + salt + curtime + YOUDAO_APP_SECRET;
    const sign = CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
    const vocabId = YOUDAO_VOCABID
    const data = {
        q,
        appKey: YOUDAO_APP_ID,
        salt,
        from,
        to,
        sign,
        signType: "v3",
        strict: "true",
        curtime,
        vocabId
    }
    const headers = {
        "Content-Type": "multipart/form-data"
    }
    const { data: resp } = await axios({
        url: "/api",
        baseURL: YOUDAO_API_BASE_URL,
        method: "post",
        headers,
        data

    })
    console.log("translate:", resp)
    if (resp.errorCode != "0") {
        console.error("translate error:", q)
        return null
    }
    return resp.translation[0]
}
// const text = "Duration: %bdr + %adr per %cld level(s)"
// const text = "Store is closed. Open from %d1:00 to %d2:00."
// const text ="nteractionIsNowInMode, Interaction is now in %s mode."
// const text = "Duration: %s seconds,%d number"
const from = "en"
const to = "zh-CHS"
// translate(text, from, to)
translate_csv()
import CryptoJS from 'crypto-js'
import axios from "axios"
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'fast-csv'
import { translate as gtranslate } from '@vitalets/google-translate-api';
import { HttpProxyAgent } from 'http-proxy-agent';
import { writeToPath } from '@fast-csv/format'
import { YOUDAO_API_BASE_URL, YOUDAO_APP_ID, YOUDAO_APP_SECRET, YOUDAO_VOCABID } from "./config.js"

const translate_csv = () => {
    const csv_path = path.resolve('./text', "Master Localization CSV Files")
    const translated_csv_path = path.resolve('./cn', "Master Localization CSV Files")
    fs.readdir(csv_path, async function (err, files) {
        let requests_count = 0
        for (const f of files) {
            // if (f.endsWith(".csv")) {
            // if (f === "Internal_Items.csv") {
            // if (f === "Internal_MagicItems.csv") {
            //     if (f === "Internal_RSC.csv") {
            //     if (f === "Internal_Factions.csv") {
                if (f === "Internal_Locations.csv") {
                const file = `${csv_path}/${f}`
                let total_row_count = 0
                let rows = []

                fs.createReadStream(file)
                    .pipe(csv.parse({ headers: true }))
                    .on('error', error => console.error(error))
                    .on('data', (row) => {
                        rows.push(row)
                    })
                    .on('end', async (rowCount) => {
                        total_row_count = rowCount
                        console.log(`Parsed ${rowCount} rows`)
                        const translated_rows= await batch_translate(rows)
                        writeToPath(`${translated_csv_path}/${f}`, translated_rows)
                            .on('error', err => console.error(err))
                            .on('finish', () => console.log('Done writing.'));

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
    const to = "zh-CN"
    if (!value) {
        return Promise.resolve(null)
    }

    //const { text: translate_val } = await gtranslate(value, { from, to })
    const { text: translate_val } = await translateWithProxy(value, from, to)

    if (translate_val) {
        return Promise.resolve([key, translate_val])
    }
}

//批量翻译
const batch_translate = async (rows) => {
    //组合
    const from = "en"
    const to = "zh-CN"
    const q = rows.map(r => r['Value']).join("\n")
    console.log("batch translate:", q)
    const translated = await translateWithProxy(q, from, to)
    const translated_rows = translated.split("\n")
    //生成新的数组
    let ret = [["Key", "Value","T"]]
    for (const [index, v] of rows.entries()) {
        const new_row = ([v['Key'], v['Value'], translated_rows[index]])
        ret.push(new_row)
    }
    // const translated = await  gtranslate(q,from,to)
    console.log("translated new rows:",ret)
    return ret 

}
async function translateWithProxy(q, from, to) {
    const timeoutMs = 5000 * 20;
    const proxy = "115.244.127.167"
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    const fetchOptions = {
        agent: new HttpProxyAgent(`http://${proxy}`),
        signal: ac.signal,
    }
    let ret = null
    try {

        console.log(`start gtranslate: ${q}`);
        const { text } = await gtranslate(q, { from, to, fetchOptions });
        console.log(`Result: ${text}`);
        ret = text
    } finally {
        clearTimeout(timer);
    }
    return ret
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
const q = "Store is closed. Open from %d1:00 to %d2:00."
// const text ="nteractionIsNowInMode, Interaction is now in %s mode."
// const text = "Duration: %s seconds,%d number"
let from = "en"
const to = "zh-CN"
// const {text}= await translateWithProxy(q, from, to) 
// console.log(text) // => 'Hello World! How are you?'
// translate(text, from, to)
translate_csv()
import fs from "fs"

const filenameToNumber = (name: string) => parseInt(name.replace(/\.png$/, ""))
const files = fs
    .readdirSync("/home/nimas/Downloads/mav0/cam0/data")
    .sort((lhs, rhs) => filenameToNumber(lhs) - filenameToNumber(rhs))

files.forEach((value, i) => {
    const newFileName = i.toString().padStart(4, "0")
    fs.renameSync(
        `/home/nimas/Downloads/mav0/cam0/data/${value}`,
        `/home/nimas/Downloads/mav0/cam0/data/${newFileName}.png`,
    )
})

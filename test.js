// new Date(86400000).toISOString().substr(11, 8)

function millisToTime(millis) {
    const totalSeconds = Math.floor(millis / 1000)

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    console.log(`${hours}г ${minutes}хв`)
}

millisToTime(21000000)
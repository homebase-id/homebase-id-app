//https://stackoverflow.com/a/21294619/15538463
export function millisToMinutesAndSeconds(millis: number | undefined) {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = Number(((millis % 60000) / 1000).toFixed(0));
    return seconds === 60
        ? minutes + 1 + ':00'
        : minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

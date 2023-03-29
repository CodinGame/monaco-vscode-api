export const mark = (name) => {
    performance.mark(name);
}

export const getMarks = () => {
    let timeOrigin = performance.timeOrigin;
    if (typeof timeOrigin !== 'number') {
        // safari: there is no timerOrigin but in renderers there is the timing-property
        // see https://bugs.webkit.org/show_bug.cgi?id=174862
        timeOrigin = performance.timing.navigationStart || performance.timing.redirectStart || performance.timing.fetchStart;
    }
    const result = [{ name: 'code/timeOrigin', startTime: Math.round(timeOrigin) }];
    for (const entry of performance.getEntriesByType('mark')) {
        result.push({
            name: entry.name,
            startTime: Math.round(timeOrigin + entry.startTime)
        });
    }
    return result;
}

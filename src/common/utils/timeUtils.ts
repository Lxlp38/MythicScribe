export const timeCounter = () => {
    const start = Date.now();
    let step = start;
    return {
        delta: () => Date.now() - start,
        step: () => {
            const now = Date.now();
            const delta = now - step;
            step = now;
            return delta;
        },
        stop: () => (Date.now() - start).toString() + ' ms',
    };
};

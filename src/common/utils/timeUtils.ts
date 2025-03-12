export const timeCounter = () => {
    const start = Date.now();
    return {
        delta: () => Date.now() - start,
        stop: () => (Date.now() - start).toString() + ' ms',
    };
};

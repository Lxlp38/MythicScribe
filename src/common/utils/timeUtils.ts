export const timeCounter = () => {
    const start = Date.now();
    return {
        stop: () => (Date.now() - start).toString() + ' ms',
    };
};

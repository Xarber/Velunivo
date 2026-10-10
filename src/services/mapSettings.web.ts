export const loadMapSettings = async () => {};
export const hasMapKey = () => false;
export const downloadStyle = (): string | undefined => undefined;
export const setMapKey = async (_value: string) => { throw new Error('Map downloads require the native app.'); };

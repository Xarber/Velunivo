/** Tiny map pins do not need a full-size video call. Per recipient, target <=80 kbps. */
export const PIN_VIDEO={width:96,height:96,frameRate:6,bitrate:80000} as const;
// AVCapture devices can reject a 6 fps capture request. Encode the small pin at
// 6 fps, but use a supported camera capture cadence on native platforms.
export const PREVIEW_VIDEO={width:240,height:180,frameRate:12,bitrate:200000} as const;
export const WEB_PIN_CAPTURE={width:320,height:240,frameRate:12} as const;
export const NATIVE_PIN_CAPTURE={width:320,height:240,frameRate:30} as const;
export async function limitPinVideo<T extends {encodings:{maxBitrate?:number|null;maxFramerate?:number|null;scaleResolutionDownBy?:number|null}[]}>(sender:{getParameters():T;setParameters(parameters:T):Promise<unknown>},priority=false){const parameters=sender.getParameters();if(!parameters.encodings.length)return;for(const encoding of parameters.encodings){encoding.maxBitrate=priority?PREVIEW_VIDEO.bitrate:PIN_VIDEO.bitrate;encoding.maxFramerate=priority?PREVIEW_VIDEO.frameRate:PIN_VIDEO.frameRate;encoding.scaleResolutionDownBy=WEB_PIN_CAPTURE.width/(priority?PREVIEW_VIDEO.width:PIN_VIDEO.width);}try{await sender.setParameters(parameters);}catch{/* Small capture constraints remain the fallback on unsupported platforms. */}}

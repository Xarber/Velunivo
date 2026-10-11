/** Preserve useful user messages; internal exception names and stack details belong in Developer Mode. */
export function publicError(message:string,developer:boolean,fallback='Something went wrong. Please try again.'){
 if(developer)return message;
 if(message.startsWith('Live Activity could not start:'))return 'Live Activity could not start. Check Live Activities in iOS Settings.';
 if(message.startsWith('Live Activity could not update:'))return 'Live Activity could not update. Navigation continues normally.';
 return /Exception|FunctionCall|\bstack\b|\bat \w+\(|Error:|\b[A-Z_]{3,}_ERROR\b/.test(message)?fallback:message;
}

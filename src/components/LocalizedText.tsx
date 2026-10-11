import React from 'react';
import {Text as NativeText,TextProps} from 'react-native';
import {useLanguage} from '../i18n/react';
import {t} from '../i18n/core';
export default function LocalizedText({children,translate=true,...props}:TextProps & {translate?:boolean}){
 useLanguage();
 const render=(value:React.ReactNode):React.ReactNode=>typeof value==='string'?t(value):Array.isArray(value)?value.every(part=>typeof part==='string'||typeof part==='number')?t(value.join('')):value.map(render):value;
 return <NativeText {...props} accessibilityLabel={props.accessibilityLabel?t(props.accessibilityLabel):undefined}>{translate?render(children):children}</NativeText>;
}

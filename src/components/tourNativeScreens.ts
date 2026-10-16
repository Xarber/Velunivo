import {ImageSourcePropType} from 'react-native';
export type NativeTourScreens={iphone:ImageSourcePropType[];ipad:ImageSourcePropType[];android:ImageSourcePropType[];androidTablet:ImageSourcePropType[]};
/** Platform-specific siblings keep other platforms' image bytes out of native bundles. */
export const nativeTourScreens:NativeTourScreens={iphone:[],ipad:[],android:[],androidTablet:[]};

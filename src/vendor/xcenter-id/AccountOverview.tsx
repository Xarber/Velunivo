// Adapted from Xarber/xcenter-id, commit 5f4892f8b9cd3b6afe58cbd02c3fbcc5a161fbe3. AGPL-3.0-only.
import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View, useColorScheme, type ImageSourcePropType } from 'react-native';

export type OverviewProfile = {
  name: string;
  username: string;
  email?: string;
  ageRange?: string;
  photo?: ImageSourcePropType;
  verified?: boolean;
  administrator?: boolean;
};

export type AccountOverviewProps = {
  profile: OverviewProfile | null;
  mode: 'entry' | 'details';
  clientId: string;
  translate: (value: string) => string;
  disabled?: boolean;
  pendingSignIn?: boolean;
  signInDescription?: string;
  onSignIn?: () => void | Promise<void>;
  onCancelSignIn?: () => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
  onManageAccount?: () => void;
};

const palettes = {
  light:{hero:'#e7efff', panel:'#ffffff', ink:'#142438', muted:'#526078', accent:'#174eaa', line:'#dbe3ef'},
  dark:{hero:'#243657', panel:'#192433', ink:'#f4f7ff', muted:'#bbc9df', accent:'#b9d0ff', line:'#435676'},
};

/** Account entry and details. The host validates and stores its own session. */
export function AccountOverview({
  profile, mode, clientId, translate, disabled, pendingSignIn, signInDescription,
  onSignIn, onCancelSignIn, onSignOut, onManageAccount,
}: AccountOverviewProps) {
  const palette = useColorScheme() === 'dark' ? palettes.dark : palettes.light;
  const [pictureFailed, setPictureFailed] = useState<string>();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setError('');
    try { await (pendingSignIn ? onCancelSignIn?.() : onSignIn?.()); }
    catch { setError('Sign-in did not complete. Please try again.'); }
    finally { setPending(false); }
  }
  async function signOut(){
    setPending(true);setError('');
    try{await onSignOut?.();}
    catch{setError('Could not sign out. Try again.');}
    finally{setPending(false);}
  }
  async function open(url:string){
    try{await Linking.openURL(url);}
    catch{setError('Could not open X-Center ID. Try again.');}
  }

  function action(label:string,onPress:()=>void,destructive=false){
    return <Pressable accessibilityRole="button" disabled={pending || disabled} onPress={onPress}
      style={({pressed})=>[styles.action,{backgroundColor:palette.panel,borderColor:palette.line,opacity:pressed?.65:1}]}>
      <Text style={[styles.actionLabel,{color:destructive?(palette===palettes.dark?'#ffadad':'#a42635'):palette.accent}]}>{translate(label)}</Text>
    </Pressable>;
  }

  const badge=(label:string)=><Text style={[styles.badge,{color:palette.accent,backgroundColor:palette.panel}]}>{translate(label)}</Text>;
  const brand=<View style={styles.brand}>
    <Image source={require('../../../assets/identity/xcenter-id-mark.png')} accessible={false} style={styles.mark}/>
    <Text style={[styles.actionLabel,{color:palette.accent}]}>X-Center ID</Text>
  </View>;
  if (!profile) return <View style={[styles.hero, { backgroundColor: palette.hero }]}>
    {brand}
    <Text accessibilityRole="header" style={[styles.name, { color: palette.ink }]}>{translate('Sign in or create an account')}</Text>
    {!!signInDescription && <Text style={{ color: palette.muted }}>{signInDescription}</Text>}
    {onSignIn && action(pendingSignIn ? 'Cancel sign-in' : 'Sign in with X-Center ID', () => void start())}
    {!!error && <Text accessibilityRole="alert" style={{ color: palette.ink }}>{translate(error)}</Text>}
  </View>;
  const photoKey = typeof profile.photo === 'object' && !Array.isArray(profile.photo) ? profile.photo.uri : undefined;
  const showPhoto = profile.photo && (!photoKey || photoKey !== pictureFailed);
  const identity=<>
      <View style={styles.identity}>
        {showPhoto?<Image source={profile.photo} accessibilityLabel={translate('Profile photo')} style={styles.avatar} onError={()=>setPictureFailed(photoKey)}/>:
          <View accessible={false} style={[styles.avatar,styles.avatarFallback,{backgroundColor:palette.panel}]}>
            <Text style={[styles.initial,{color:palette.accent}]}>{Array.from(profile.name.trim())[0]?.toLocaleUpperCase()??'?'}</Text>
          </View>}
        <View style={styles.identityText}>
          <Text accessibilityRole="header" style={[styles.name,{color:palette.ink}]}>{profile.name}</Text>
          {!!profile.username && <Text style={{color:palette.muted}}>@{profile.username}</Text>}
          {!!profile.email&&<Text style={{color:palette.muted}}>{profile.email}</Text>}
          {!!profile.ageRange && mode === "details" && <Text style={{color:palette.muted}}>{profile.ageRange}</Text>}
        </View>
      </View>
      {(profile.verified||profile.administrator)&&<View style={styles.badges}>
        {profile.verified&&badge('Verified account')}
        {profile.administrator&&badge('X-Center administrator')}
      </View>}
  </>;
  return <View style={[styles.hero, { backgroundColor: palette.hero }]}>
    {brand}{identity}
    {mode === 'entry' && onManageAccount && action('Manage account & data →', onManageAccount)}
    {mode === 'details' && <View style={styles.badges}>
      {action('Open dashboard', () => void open('https://id.xcenter.it/dashboard'))}
      {action('Manage app', () => void open('https://id.xcenter.it/permissions/' + encodeURIComponent(clientId)))}
      {onSignOut && action('Sign out', () => void signOut(), true)}
    </View>}
    {!!error && <Text accessibilityRole="alert" style={{ color: palette.ink }}>{translate(error)}</Text>}
  </View>;
}

const styles=StyleSheet.create({
  hero:{borderRadius:22,padding:18,gap:13},
  brand:{flexDirection:'row',alignItems:'center',gap:8},
  mark:{width:28,height:24,resizeMode:'contain'},
  identity:{flexDirection:'row',alignItems:'center',gap:13},
  identityText:{flex:1,minWidth:0,gap:3},
  avatar:{width:58,height:58,borderRadius:29},
  avatarFallback:{alignItems:'center',justifyContent:'center'},
  initial:{fontSize:21,fontWeight:'700'},
  name:{fontSize:23,fontWeight:'800'},
  badges:{flexDirection:'row',gap:6,flexWrap:'wrap'},
  badge:{borderRadius:20,overflow:'hidden',paddingHorizontal:9,paddingVertical:4,fontSize:13,fontWeight:'600'},
  action:{alignSelf:'flex-start',minHeight:46,paddingVertical:9,paddingHorizontal:13,borderRadius:11,borderWidth:1,justifyContent:'center'},
  actionLabel:{fontSize:15,fontWeight:'600'},
});

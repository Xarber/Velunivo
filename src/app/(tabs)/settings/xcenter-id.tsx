import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountSync from '../../../components/AccountSync';
import Text from '../../../components/LocalizedText';
import { IconButton, styles, usePalette } from '../../../components/ui';
import { goBack } from '../../../services/navigation';

export default function XCenterAccountScreen() {
  const palette = usePalette();
  return <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
    <ScrollView contentContainerStyle={{ padding: 24, gap: 20, width: '100%', maxWidth: 700, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton label="Back to Settings" icon="chevron-back" onPress={() => goBack('/settings')}/>
        <Text style={[styles.title, { color: palette.text }]}>X-Center ID</Text>
      </View>
      <AccountSync/>
    </ScrollView>
  </SafeAreaView>;
}

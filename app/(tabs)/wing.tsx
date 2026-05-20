import { SafeAreaView } from 'react-native-safe-area-context';
import WingWebView from '../../components/WingWebView';
import { COLORS } from '../../constants/designSystem';

export default function WingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['bottom']}>
      <WingWebView />
    </SafeAreaView>
  );
}

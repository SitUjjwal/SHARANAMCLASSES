/**
 * Loading / brand splash — full photo with contain so logo text is not cropped.
 */
import { Dimensions, Image, StyleSheet, View } from 'react-native';

const brandSplash = require('../assets/splash-brand.png');

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function LoadingScreen() {
  return (
    <View style={styles.root}>
      <Image
        source={brandSplash}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="SHARANAM CLASSES"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#0A3D2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
});

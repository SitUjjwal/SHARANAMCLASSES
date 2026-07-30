import { StyleSheet, Text, View } from 'react-native';

/**
 * Landing placeholder — replace with auth redirect / home when features land.
 */
export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>SHARANAM CLASSES</Text>
      <Text style={styles.subtitle}>Mobile architecture scaffold</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1F3A',
    padding: 24,
  },
  brand: {
    color: '#F5F7FA',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 8,
    color: '#A8B3C5',
    fontSize: 14,
  },
});

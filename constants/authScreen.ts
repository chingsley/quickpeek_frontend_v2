import { colors } from '@/constants/colors';
import { StyleSheet } from 'react-native';

/** Shared layout and chrome for sign-in and sign-up screens. */
export const authScreenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.BG_WHITE,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  link: {
    marginTop: 20,
    color: colors.LINK,
    textAlign: 'center',
  },
});

import { formFieldFooterStyles as styles } from '@/constants/formField';
import React from 'react';
import { Text, View } from 'react-native';

type FormFieldFooterProps = {
  error?: string | null;
  valueLength?: number;
  maxLength?: number;
};

/**
 * Shared footer for labeled inputs: validation message on the left, optional
 * "x / max" counter on the right.
 */
const FormFieldFooter = ({ error, valueLength = 0, maxLength }: FormFieldFooterProps) => {
  const showCounter = maxLength != null;
  if (!error && !showCounter) return null;

  return (
    <View style={styles.row} accessibilityRole="text">
      {error ? (
        <Text style={styles.errorText} numberOfLines={3}>
          {error}
        </Text>
      ) : (
        <View style={styles.errorSpacer} />
      )}
      {showCounter ? (
        <Text style={styles.counter}>
          {valueLength} / {maxLength}
        </Text>
      ) : null}
    </View>
  );
};

export default FormFieldFooter;

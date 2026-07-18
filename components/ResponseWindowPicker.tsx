import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import {
  MAX_RESPONSE_WINDOW_MS,
  MIN_RESPONSE_WINDOW_MS,
  RESPONSE_WINDOW_PRESETS,
} from '@/constants/responseWindow';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  onSelect: (timeToRespondMs: number) => Promise<void>;
  compact?: boolean;
  title?: string;
};

const ResponseWindowPicker = ({
  onSelect,
  compact = false,
  title = 'How long should the responder have to reply?',
}: Props) => {
  const [loadingMs, setLoadingMs] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = async (ms: number) => {
    setLoadingMs(ms);
    try {
      await onSelect(ms);
    } finally {
      setLoadingMs(null);
    }
  };

  const handleCustomSubmit = async () => {
    const minutes = parseInt(customMinutes, 10);
    if (!minutes || minutes < 1) return;

    const ms = minutes * 60 * 1000;
    if (ms < MIN_RESPONSE_WINDOW_MS || ms > MAX_RESPONSE_WINDOW_MS) return;

    await handleSelect(ms);
    setShowCustom(false);
    setCustomMinutes('');
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chipRow}>
        {RESPONSE_WINDOW_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.ms}
            style={styles.chip}
            onPress={() => handleSelect(preset.ms)}
            disabled={loadingMs !== null}
          >
            {loadingMs === preset.ms ? (
              <ActivityIndicator size="small" color={colors.PRIMARY} />
            ) : (
              <Text style={styles.chipText}>{preset.label}</Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, showCustom && styles.chipActive]}
          onPress={() => setShowCustom((value) => !value)}
          disabled={loadingMs !== null}
        >
          <Text style={styles.chipText}>Custom</Text>
        </TouchableOpacity>
      </View>

      {showCustom && (
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Minutes"
            placeholderTextColor={colors.MEDIUM_GRAY}
            keyboardType="number-pad"
            value={customMinutes}
            onChangeText={setCustomMinutes}
          />
          <TouchableOpacity style={styles.customBtn} onPress={handleCustomSubmit}>
            <Text style={styles.customBtnText}>Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ResponseWindowPicker;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 14,
    padding: 16,
    backgroundColor: colors.BG_WHITE,
    marginBottom: 12,
  },
  cardCompact: {
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 52,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: colors.PRIMARY,
    backgroundColor: colors.LIGHT_GREEN,
  },
  chipText: {
    fontFamily: 'roboto-medium',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.PRIMARY,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.CARD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'roboto',
    fontSize: fonts.FONT_SIZE_SMALL,
    color: colors.TEXT_DARK,
  },
  customBtn: {
    backgroundColor: colors.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  customBtnText: {
    fontFamily: 'roboto-bold',
    fontSize: fonts.FONT_SIZE_XS,
    color: colors.BG_WHITE,
  },
});

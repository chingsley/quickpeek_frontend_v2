import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useActionSheet } from '@/components/shared/useActionSheet';

jest.mock('@/components/shared/ActionSheet', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible, title }: { visible: boolean; title: string }) =>
      visible ? React.createElement(View, { testID: 'action-sheet' }, React.createElement(Text, null, title)) : null,
  };
});

const Host = () => {
  const { showActionSheet, hideActionSheet, actionSheet } = useActionSheet();
  return (
    <View>
      <Pressable testID="open" onPress={() => showActionSheet({ title: 'Request sent' })}>
        <Text>open</Text>
      </Pressable>
      <Pressable testID="close" onPress={hideActionSheet}>
        <Text>close</Text>
      </Pressable>
      {actionSheet}
    </View>
  );
};

describe('useActionSheet', () => {
  it('shows, updates and hides the sheet', () => {
    render(<Host />);
    expect(screen.queryByTestId('action-sheet')).toBeNull();

    fireEvent.press(screen.getByTestId('open'));
    expect(screen.getByText('Request sent')).toBeTruthy();

    fireEvent.press(screen.getByTestId('close'));
    expect(screen.queryByTestId('action-sheet')).toBeNull();
  });
});

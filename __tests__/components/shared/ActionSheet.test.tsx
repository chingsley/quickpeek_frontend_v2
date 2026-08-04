import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import ActionSheet from '@/components/shared/ActionSheet';

jest.mock('@/components/shared/BottomSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? React.createElement(View, null, children) : null,
  };
});

jest.mock('@/components/ask/AnimatedSuccessMark', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'success-mark' }),
  };
});

describe('ActionSheet', () => {
  it('renders title, message and a default OK button that closes', () => {
    const onClose = jest.fn();
    render(
      <ActionSheet visible onClose={onClose} title="Saved" message="Your profile has been updated." />,
    );
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('Your profile has been updated.')).toBeTruthy();

    fireEvent.press(screen.getByText('OK'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when hidden', () => {
    render(<ActionSheet visible={false} onClose={jest.fn()} title="Hidden" />);
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('shows the success mark only for the success tone', () => {
    const { rerender } = render(
      <ActionSheet visible onClose={jest.fn()} title="Done" tone="success" />,
    );
    expect(screen.getByTestId('success-mark')).toBeTruthy();

    rerender(<ActionSheet visible onClose={jest.fn()} title="Done" tone="info" />);
    expect(screen.queryByTestId('success-mark')).toBeNull();

    rerender(<ActionSheet visible onClose={jest.fn()} title="Done" tone="error" />);
    expect(screen.queryByTestId('success-mark')).toBeNull();
  });

  it('runs primary and secondary button actions and closes', () => {
    const onClose = jest.fn();
    const onOpenChat = jest.fn();
    const onOk = jest.fn();
    render(
      <ActionSheet
        visible
        onClose={onClose}
        title="Request sent"
        message="The questioner will review your request."
        tone="success"
        buttons={[
          { label: 'Open chat', onPress: onOpenChat },
          { label: 'OK', onPress: onOk, role: 'secondary' },
        ]}
      />,
    );

    fireEvent.press(screen.getByText('Open chat'));
    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText('OK'));
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('supports buttons without an onPress handler (just close)', () => {
    const onClose = jest.fn();
    render(
      <ActionSheet
        visible
        onClose={onClose}
        title="Multiple responders"
        tone="info"
        buttons={[{ label: 'Cancel', role: 'secondary' }]}
      />,
    );
    fireEvent.press(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('honors an explicit primary role and the pressed secondary style', () => {
    render(
      <ActionSheet
        visible
        onClose={jest.fn()}
        title="Confirm"
        buttons={[{ label: 'Accept', role: 'primary' }, { label: 'Maybe later' }]}
      />,
    );
    expect(screen.getByText('Accept')).toBeTruthy();

    // 'Maybe later' defaults to secondary at index 1 — verify its pressed style.
    let current: ReturnType<typeof screen.getByText> | null = screen.getByText('Maybe later');
    let styleFn: ((state: { pressed: boolean }) => unknown[]) | undefined;
    while (current) {
      if (typeof current.props?.style === 'function') {
        styleFn = current.props.style;
        break;
      }
      current = current.parent;
    }
    expect(styleFn).toBeTruthy();
    const idle = styleFn!({ pressed: false });
    const pressed = styleFn!({ pressed: true });
    expect(idle[1]).toBeFalsy();
    expect(pressed[1]).toBeTruthy();
  });
});
